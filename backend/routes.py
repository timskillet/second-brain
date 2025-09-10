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
from core.chat_history import save_message
from core.chain import chat_stream

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
        
        # Invoke the graph
        async def generate_stream():
                try:
                    async for chunk in chat_stream(chat_id, message, None):
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
        conn = sqlite3.connect(CHAT_HISTORY_DB_FILE)
        cursor = conn.cursor()
        chat_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        cursor.execute(
            "INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (chat_id, chat_title, now, now)
        )
        conn.commit()
        conn.close()
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
        conn = sqlite3.connect(CHAT_HISTORY_DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, chat_id, role, content, timestamp FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC",
            (chat_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        
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