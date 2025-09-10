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
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            cursor.execute("""
                INSERT INTO files (id, name, path) VALUES (?, ?, ?)
            """, (id, name, path))
            conn.commit()
    except Exception as e:
        print(f"Error in save_file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def delete_file(file_name: str):
    """Delete a file from the database"""
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM files WHERE name = ?", (file_name,))
            conn.commit()
    except Exception as e:
        print(f"Error in delete_file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_files():
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM files
            """)
            return cursor.fetchall()
    except Exception as e:
        print(f"Error in get_files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_file(file_name: str):
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM files WHERE name = ?
            """, (file_name,))
            file = cursor.fetchone()
            return file[0] if file else None
    except Exception as e:
        print(f"Error in get_file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def save_message(chat_id: str, role: str, content: str):
    id = str(uuid.uuid4())
    timestamp = datetime.now()
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)
            """, (id, chat_id, role, content, timestamp))
            conn.commit()
    except Exception as e:
        print(f"Error in save_message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def load_messages(chat_id: str):
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC
            """, (chat_id,))
            rows = cursor.fetchall()
            messages = []
            for row in rows:
                if row[2] == "user":
                    messages.append(HumanMessage(content=row[3]))
                else:
                    messages.append(AIMessage(content=row[3]))
            return messages
    except Exception as e:
        print(f"Error in load_messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def clear_messages(chat_id: str):
    try:
        with sqlite3.connect(CHAT_HISTORY_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chat_messages WHERE chat_id = ?", (chat_id,))
            conn.commit()
    except Exception as e:
        print(f"Error in clear_messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))