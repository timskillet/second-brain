import sqlite3
from datetime import datetime
import os
import uuid
from langchain_core.messages import HumanMessage, AIMessage

db_file = "../data/chat_memory.db"
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

def init_db():
    os.makedirs(os.path.dirname(db_file), exist_ok=True)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            chat_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

def save_message(chat_id: str, role: str, content: str):
    id = str(uuid.uuid4())
    timestamp = datetime.now()
    cursor.execute("""
        INSERT INTO chat_messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)
    """, (id, chat_id, role, content, timestamp))
    conn.commit()

def load_messages(chat_id: str):
    cursor.execute("""
        SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC
    """, (chat_id,))
    rows = cursor.fetchall()
    messages = []
    for row in rows:
        if row[2] == "human":
            messages.append(HumanMessage(content=row[3]))
        else:
            messages.append(AIMessage(content=row[3]))
    return messages

def clear_messages(chat_id: str):
    cursor.execute("DELETE FROM chat_messages WHERE chat_id = ?", (chat_id,))
    conn.commit()