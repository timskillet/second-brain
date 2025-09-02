import os

# Models
MODEL_PATH = os.getenv("MODEL_PATH", "models/zephyr-7b-alpha.Q5_K_M.gguf")

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = os.getenv("PORT", 8002)
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Database configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.getenv("DB_FILE", os.path.join(DATA_DIR, "chat_history.db"))