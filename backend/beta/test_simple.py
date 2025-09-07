# backend/beta/test_chain.py
import asyncio
import sys
import os
import sqlite3
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from beta.chain import chat
from beta.memory import init_db, save_message, load_messages
from langchain_core.messages import HumanMessage, AIMessage

chat_id = "test_simple_1"

async def test_memory_backend():
    """Test the memory backend functionality."""
    print("🧠 Testing Memory Backend")
    print("=" * 40)
    
    # Initialize database
    print("1. Initializing database...")
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False
    
    # Test saving messages
    print("\n2. Testing message saving...")
    try:
        save_message(chat_id, "user", "Hello, my name is Tim.")
        save_message(chat_id, "assistant", "Hello Tim! Nice to meet you.")
        save_message(chat_id, "user", "I'm a software developer.")
        save_message(chat_id, "assistant", "That's great! What kind of software do you develop?")
        print("✅ Messages saved successfully")
    except Exception as e:
        print(f"❌ Message saving failed: {e}")
        return False
    
    # Test loading messages
    print("\n3. Testing message loading...")
    try:
        messages = load_messages(chat_id)
        print(f"✅ Loaded {len(messages)} messages")
        for i, msg in enumerate(messages):
            role = "Human" if isinstance(msg, HumanMessage) else "Assistant"
            content = msg.content[:50] + "..." if len(msg.content) > 50 else msg.content
            print(f"  {i+1}. {role}: {content}")
    except Exception as e:
        print(f"❌ Message loading failed: {e}")
        return False
    
    return True

async def test_chain_with_memory():
    """Test the chain with memory functionality."""
    print("\n\n�� Testing Chain with Memory")
    print("=" * 40)
    
    # Clear existing messages for clean test
    print("1. Clearing existing messages...")
    try:
        conn = sqlite3.connect("../data/chat_memory.db")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_messages")
        conn.commit()
        conn.close()
        print("✅ Messages cleared")
    except Exception as e:
        print(f"⚠️ Could not clear messages: {e}")
    
    # Test 1: First message
    print("\n2. Testing first message...")
    first_query = "My name is Tim and I'm a software developer. I am 22 years old and I live in the United States."
    print(f"Query: {first_query}")
    
    try:
        response_chunks = []
        async for chunk in chat(chat_id, first_query):
            if isinstance(chunk, str):
                response_chunks.append(chunk)
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict):
                print(f"\n\nFinal response: {chunk['response']}")
                print(f"Messages in history: {len(chunk['messages'])}")
                break
    except Exception as e:
        print(f"❌ First message failed: {e}")
        return False
    
    # Test 2: Follow-up message (should remember context)
    print("\n\n3. Testing follow-up message...")
    follow_up_query = "What do you know about me?"
    print(f"Query: {follow_up_query}")
    
    try:
        response_chunks = []
        async for chunk in chat(chat_id, follow_up_query):
            if isinstance(chunk, str):
                response_chunks.append(chunk)
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict):
                print(f"\n\nFinal response: {chunk['response']}")
                print(f"Messages in history: {len(chunk['messages'])}")
                break
    except Exception as e:
        print(f"❌ Follow-up message failed: {e}")
        return False
    
    # Test 3: Another follow-up
    print("\n\n4. Testing another follow-up...")
    third_query = "What programming languages should I learn?"
    print(f"Query: {third_query}")
    
    try:
        response_chunks = []
        async for chunk in chat(chat_id, third_query):
            if isinstance(chunk, str):
                response_chunks.append(chunk)
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict):
                print(f"\n\nFinal response: {chunk['response']}")
                print(f"Messages in history: {len(chunk['messages'])}")
                break
    except Exception as e:
        print(f"❌ Third message failed: {e}")
        return False
    
    return True

async def test_simple_chat():
    """Test the simple chat functionality."""
    print("\n\n💬 Testing Simple Chat")
    print("=" * 40)
    
    # Test 1: First message
    print("\n1. Testing first message...")
    first_query = "Can you explain backend development?"
    print(f"Query: {first_query}")
    
    try:
        response_chunks = []
        async for chunk in chat(chat_id, first_query):
            if isinstance(chunk, str):
                response_chunks.append(chunk)
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict):
                print(f"\n\nFinal response: {chunk['response']}")
                print(f"Messages in history: {len(chunk['messages'])}")
                break
    except Exception as e:
        print(f"❌ First message failed: {e}")
        return False
    
    # Test 2: Follow-up message
    print("\n2. Testing follow-up message...")
    follow_up_query = "Based on what you just said, what are the best steps to learn this topic?"
    print(f"Query: {follow_up_query}")
    
    try:
        response_chunks = []
        async for chunk in chat(chat_id, follow_up_query):
            if isinstance(chunk, str):
                response_chunks.append(chunk)
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict):
                print(f"\n\nFinal response: {chunk['response']}")
                print(f"Messages in history: {len(chunk['messages'])}")
                break
    except Exception as e:
        print(f"❌ Follow-up message failed: {e}")
        return False
    
    return True

async def main():
    """Run all chain tests."""
    print("🚀 Starting Chain Memory Tests")
    print("=" * 50)
    
    try:
        # Test 1: Memory backend
        memory_ok = await test_memory_backend()
        if not memory_ok:
            print("\n❌ Memory backend tests failed. Stopping.")
            return
        
        # Test 2: Chain with memory
        chain_ok = await test_chain_with_memory()
        if not chain_ok:
            print("\n❌ Chain tests failed. Stopping.")
            return
        
        # Test 3: Simple chat
        simple_ok = await test_simple_chat()
        if not simple_ok:
            print("\n❌ Simple chat tests failed. Stopping.")
            return
        
        print("\n\n✅ All chain memory tests completed successfully!")
        print("\n🎉 Your memory backend is working correctly!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Run the tests
    init_db()
    asyncio.run(main())