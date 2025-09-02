"""
FastAPI route definitions
"""

from fastapi import APIRouter, HTTPException, Body
from core.llm import llm
from fastapi.responses import StreamingResponse
from core.chain import chain
import sqlite3
from config import DB_FILE
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

@router.post("/chat")
def chat(request: dict = Body(...)):
    """Chat endpoint"""
    try:
        assert request.get("chat_id") is not None 
        assert request.get("chat_title") is not None
        assert request.get("message") is not None
        assert request.get("created_at") is not None
        
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
        add_message(chat_id, user_message)

        async def token_stream():
            response = ""
            try:
                async for chunk in chain.astream({"query": message}):
                    response += chunk
                    yield chunk
                yield "\n[END]"
            except Exception as e:
                print(f"Error in chat endpoint: {e}")
                yield f"\n[ERROR] {str(e)}"

            # Add response to chat
            response = {
                "id": str(uuid.uuid4()),
                "chat_id": chat_id,
                "role": "ai",
                "content": response,
                "timestamp": datetime.now().isoformat()
            }
            add_message(chat_id, response)
        
        return StreamingResponse(token_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        print(f"Error in chat endpoint: {e}")


# Chat History Routes
@router.post("/chats/{chat_id}/messages")
async def add_message(chat_id: str, message_data: dict = Body(...)):
    """Add a message to a chat"""
    try: 
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        messages = message_data["messages"]
        cursor.executemany(
            "INSERT INTO messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)",
            messages
        )
        conn.commit()
        conn.close()
        return {"message_id": message_data["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        print(f"Error in add_message endpoint: {e}")
        return {"error": str(e)}

@router.post("/chats")
async def create_chat(chat_title: str):
    """Create a new chat"""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        chat_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO chats (id, title) VALUES (?, ?)",
            (chat_id, chat_title)
        )
        conn.commit()
        conn.close()
        return {"chat_id": chat_id, "title": chat_title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        print(f"Error in create_chat endpoint: {e}")
        return {"error": str(e)}

@router.get("/chats/{chat_id}")
async def get_chat(chat_id: str):
    """Get specific chat with messages"""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
            (chat_id,)
        )
        chat = cursor.fetchall()
        conn.close()
        return {"chat_id": chat_id, "messages": chat}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        print(f"Error in get_chat endpoint: {e}")
        return {"error": str(e)}

@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    """Delete a chat and all its messages"""