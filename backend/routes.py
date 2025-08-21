"""
FastAPI route definitions
"""
from fastapi import APIRouter, HTTPException, File, UploadFile, Body
import os
from core.llm import llm
import asyncio
from langchain_core.callbacks import BaseCallbackHandler
from langchain_openai import ChatOpenAI
from fastapi.responses import StreamingResponse

router = APIRouter()

# ---------- API Routes ----------
@router.get("/ping")
def ping():
    return {"message": "pong"}

@router.get("/health")
def health():
    """Health check endpoint"""
    return {"ok": True, "status": "healthy"}

@router.post("/chat")
async def chat(request: dict = Body(...)):
    """Chat endpoint"""
    try:
        message = request.get("message")
        user_id = request.get("user_id", "user")

        async def token_stream():
            try:
                # Stream the response token by token
                async for chunk in llm.astream(message):
                    if chunk.content:
                        yield chunk.content
                # Send a special end marker
                yield "\n[END]"
            except Exception as e:
                print(f"Error in token stream: {str(e)}")
                yield f"\n[ERROR] {str(e)}"

        return StreamingResponse(
            token_stream(), 
            media_type="text/plain",
            headers={"Cache-Control": "no-cache"}
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))