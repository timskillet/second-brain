"""
FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import HOST, PORT, CORS_ORIGINS

# Import routes
from routes import router

# Initialize FastAPI app
app = FastAPI(title="Second Brain Server", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# ---------- Main Entry Point ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)