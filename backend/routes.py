"""
FastAPI route definitions
"""

from fastapi import APIRouter, HTTPException, Body
from core.llm import llm
from fastapi.responses import StreamingResponse
from core.chain import chain
import sqlite3
from config import CHAT_HISTORY_DB_FILE
import uuid
from datetime import datetime

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
async def chat(chat_id: str, request: dict = Body(...)):
    """Chat endpoint"""
    try:
        message = request.get("message")
        created_at = request.get("created_at")

        return await chat({"chat_id": chat_id, "message": message, "created_at": created_at})
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(request: dict = Body(...)):
    """Chat endpoint"""
    try:
        chat_id = request.get("chat_id")
        chat_title = request.get("chat_title")
        message = request.get("message")
        created_at = request.get("created_at")

        # Add message to chat
        user_message = {
            "id": str(uuid.uuid4()),
            "chat_id": chat_id,
            "role": "user",
            "content": message,
            "timestamp": created_at
        }
        await add_message(chat_id, user_message)

        async def token_stream():
            response = ""
            try:
                async for chunk in chain.astream({"query": message}):
                    response += chunk
                    yield chunk
                yield "\n[END]"
                
                # Add response to chat only if streaming was successful
                if response:
                    ai_message = {
                        "id": str(uuid.uuid4()),
                        "chat_id": chat_id,
                        "role": "assistant",
                        "content": response,
                        "timestamp": datetime.now().isoformat()
                    }
                    await add_message(chat_id, ai_message)
                    
            except Exception as e:
                print(f"Error in token_stream: {e}")
                yield f"\n[ERROR] {str(e)}"
        
        return StreamingResponse(token_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
    except Exception as e:
        import traceback
        print(f"Error in chat endpoint: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# Chat History Routes
@router.post("/chats/{chat_id}/messages")
async def add_message(chat_id: str, message_data: dict = Body(...)):
    """Add a message to a chat"""
    try: 
        conn = sqlite3.connect(CHAT_HISTORY_DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)",
            (message_data["id"], chat_id, message_data["role"], message_data["content"])
        )
        conn.commit()
        conn.close()
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
        
        print(f"Chats: {chats}")
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
            "SELECT id, chat_id, role, content, timestamp FROM messages WHERE chat_id = ? ORDER BY timestamp ASC",
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