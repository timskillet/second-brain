import os

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Models
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "models", "zephyr-7b-alpha.Q5_K_M.gguf"))

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = os.getenv("PORT", 8002)
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Database configuration
DATA_DIR = os.path.join(BASE_DIR, "data")
CHAT_HISTORY_DB_FILE = os.getenv("CHAT_HISTORY_DB_FILE", os.path.join(DATA_DIR, "chat_history.db"))
CHROMA_DB_FILE = os.getenv("CHROMA_DB_FILE", os.path.join(DATA_DIR, "chroma_db"))