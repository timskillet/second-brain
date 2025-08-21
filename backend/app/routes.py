"""
FastAPI route definitions
"""
from fastapi import APIRouter, HTTPException, File, UploadFile, Body
import os

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
async def chat(message: str = Body(...)):
    """Chat endpoint"""
    try:
        response = llm.invoke(message)
        return {"message": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))