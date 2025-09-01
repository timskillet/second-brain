"""
FastAPI route definitions
"""

from fastapi import APIRouter, HTTPException, Body
from core.llm import llm
from fastapi.responses import StreamingResponse
from core.chain import chain

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
        message = request.get("message")

        async def token_stream():
            try:
                async for chunk in chain.astream({"query": message}):
                    yield chunk
                yield "\n[END]"
            except Exception as e:
                print(f"Error in chat endpoint: {e}")
                yield f"\n[ERROR] {str(e)}"
        return StreamingResponse(token_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        print(f"Error in chat endpoint: {e}")

