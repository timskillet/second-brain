"""
FastAPI server for LLM
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from config import HOST, PORT, CORS_ORIGINS

# Initialize FastAPI app
app = FastAPI(title="Second Brain Server", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)

# ---------- Main Entrypoint ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)