import sqlite3
from datetime import datetime
import os
import uuid
from langchain_core.messages import HumanMessage, AIMessage
from config import CHAT_HISTORY_DB_FILE


def get_connection():
    """Get a new database connection for each operation"""
    return sqlite3.connect(CHAT_HISTORY_DB_FILE)

def init_db():
    os.makedirs(os.path.dirname(CHAT_HISTORY_DB_FILE), exist_ok=True)
    conn = get_connection()
    try:
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
        conn.commit()
    finally:
        conn.close()

def save_message(chat_id: str, role: str, content: str):
    id = str(uuid.uuid4())
    timestamp = datetime.now()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)
        """, (id, chat_id, role, content, timestamp))
        conn.commit()
    finally:
        conn.close()

def load_messages(chat_id: str):
    conn = get_connection()
    try:
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
    finally:
        conn.close()

def clear_messages(chat_id: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_messages WHERE chat_id = ?", (chat_id,))
        conn.commit()
    finally:
        conn.close()