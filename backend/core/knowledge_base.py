import sqlite3
from datetime import datetime
import os
import uuid
from langchain_core.messages import HumanMessage, AIMessage
from config import CHAT_HISTORY_DB_FILE
from fastapi import HTTPException

def init_db():
    os.makedirs(os.path.dirname(CHAT_HISTORY_DB_FILE), exist_ok=True)
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id TEXT PRIMARY KEY,
                    chat_id TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    personality_id TEXT DEFAULT 'assistant'
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS files (
                    id TEXT PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    path TEXT NOT NULL
                );
            """)
            
            conn.commit()
    except Exception as e:
        print(f"Error in init_db: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def save_file(id: str, name: str, path: str):
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO files (id, name, path) VALUES (?, ?, ?)",
                (id, name, path)
            )
            conn.commit()
    except Exception as e:
        print(f"Error in save_file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_files():
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, path FROM files")
            return cursor.fetchall()
    except Exception as e:
        print(f"Error in get_files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_file(name: str):
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, path FROM files WHERE name = ?", (name,))
            return cursor.fetchone()
    except Exception as e:
        print(f"Error in get_file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def delete_file(name: str):
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM files WHERE name = ?", (name,))
            conn.commit()
    except Exception as e:
        print(f"Error in delete_file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def save_message(chat_id: str, role: str, content: str):
    try:
        message_id = str(uuid.uuid4())
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO chat_messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)",
                (message_id, chat_id, role, content)
            )
            conn.commit()
    except Exception as e:
        print(f"Error in save_message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def load_messages(chat_id: str):
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT role, content FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC",
                (chat_id,)
            )
            rows = cursor.fetchall()
            
            messages = []
            for row in rows:
                if row[0] == "user":
                    messages.append(HumanMessage(content=row[1]))
                elif row[0] == "assistant":
                    messages.append(AIMessage(content=row[1]))
            
            return messages
    except Exception as e:
        print(f"Error in load_messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))