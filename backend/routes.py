"""
FastAPI route definitions
"""

from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
import sqlite3
from config import CHAT_HISTORY_DB_FILE
import uuid
from datetime import datetime
import json
from core.knowledge_base import save_message, delete_file, get_files, get_file
from core.chain import chat_stream
from core.vector_store import create_retriever, ingest_file_to_knowledge_base

router = APIRouter()

# ------- API Routes -------
@router.get("/ping")
def ping():
    return {"message": "pong"}

@router.get("/health")
def health():
    """Health check endpoint"""
    return {"ok": True, "status": "healthy"}

@router.post("/chat/{chat_id}")
async def chat_endpoint(chat_id: str, request: dict = Body(...)):
    """Chat endpoint"""
    try:
        message = request.get("message")
        files = request.get("files", [])

        files_referenced = [get_file(file) for file in files] if files else []

        retriever = None
        if files_referenced:
            retriever = create_retriever(files_referenced)

        # Invoke the graph
        async def generate_stream():
                try:
                    async for chunk in chat_stream(chat_id, message, retriever):
                        if isinstance(chunk, str):
                            yield chunk
                    # End of stream
                except Exception as e:
                    print(f"Error in chat stream: {e}")
                    yield f"Error: {str(e)}"
                yield "\n[END]"
        return StreamingResponse(
            generate_stream(), 
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
            }
        )
    except Exception as e:
        print(f"Error in chat stream endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Chat History Routes
@router.post("/chats/{chat_id}/messages")
async def add_message(chat_id: str, message_data: dict = Body(...)):
    """Add a message to a chat"""
    try: 
        save_message(chat_id, message_data["role"], message_data["content"])
        return {"message_id": message_data["id"]}
    except Exception as e:
        print(f"Error in add_message endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chats")
async def create_chat(chat_title: str):
    """Create a new chat"""
    try:
        chat_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (chat_id, chat_title, now, now)
            )
            conn.commit()
        return {
            "id": chat_id, 
            "title": chat_title,
            "created_at": now,
            "updated_at": now
        }
    except Exception as e:
        print(f"Error in create_chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/chats")
async def get_chats():
    """Get all chats"""
    try:
        conn = sqlite3.connect(CHAT_HISTORY_DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, created_at, updated_at FROM chats ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        # Convert database rows to proper Chat objects
        chats = []
        for row in rows:
            chat = {
                "id": row[0],
                "title": row[1], 
                "created_at": row[2],
                "updated_at": row[3]
            }
            chats.append(chat)
        
        return chats
    except Exception as e:
        print(f"Error in get_chats endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chats/{chat_id}")
async def get_chat(chat_id: str):
    """Get specific chat with messages"""
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute(
            "SELECT id, chat_id, role, content, timestamp FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC",
            (chat_id,)
            )
            rows = cursor.fetchall()
        
        # Convert database rows to proper Message objects
        messages = []
        for row in rows:
            message = {
                "id": row[0],
                "chat_id": row[1],
                "role": row[2],
                "content": row[3],
                "timestamp": row[4],
                "user_id": "user" if row[2] == "user" else "assistant"
            }
            messages.append(message)
        
        return messages
    except Exception as e:
        print(f"Error in get_chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    """Delete a chat and all its messages"""
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chat_messages WHERE chat_id = ?", (chat_id,))
            cursor.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
            conn.commit()
        return {"message": "Chat deleted successfully"}
    except Exception as e:
        print(f"Error in delete_chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/chats/{chat_id}")
async def update_chat_title(chat_id: str, request: dict = Body(...)):
    """Update the title of a chat"""
    try:
        new_title = request.get("title")
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE chats SET title = ? WHERE id = ?", (new_title, chat_id))
            conn.commit()
        return {"message": "Chat title updated successfully"}
    except Exception as e:
        print(f"Error in update_chat_title endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Knowledge Base Routes
@router.post("/files/{file_path}")
async def ingest_file(file_path: str):
    """Add a file to the knowledge base"""
    try:
        ingest_file_to_knowledge_base(file_path)
        return {"message": "File added to knowledge base successfully"}
    except Exception as e:
        print(f"Error in add_file endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files")
async def get_files_endpoint():
    """Get all files in the knowledge base"""
    try:
        files = get_files()
        # Convert tuples to dictionaries for better JSON serialization
        file_list = []
        for file_tuple in files:
            file_dict = {
                "id": file_tuple[0],
                "name": file_tuple[1], 
                "path": file_tuple[2]
            }
            file_list.append(file_dict)
        return file_list
    except Exception as e:
        print(f"Error in get_files endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/files/{file_name}")
async def delete_file(file_name: str):
    """Delete a file from the knowledge base"""
    try:
        delete_file(file_name)
        return {"message": "File deleted from knowledge base successfully"}
    except Exception as e:
        print(f"Error in delete_file endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))