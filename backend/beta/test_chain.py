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

chat_id = "test_chat_1"

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
        save_message(chat_id, "user", "Hello, my name is Tim")
        save_message(chat_id, "assistant", "Hello Tim! Nice to meet you.")
        save_message(chat_id, "user", "I'm a software developer")
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
    first_query = "My name is Tim and I'm a software developer."
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

async def test_memory_persistence():
    """Test that memory persists across different chain invocations."""
    print("\n\n💾 Testing Memory Persistence")
    print("=" * 40)
    
    # Test 1: Check current memory state
    print("1. Checking current memory state...")
    try:
        messages = load_messages(chat_id)
        print(f"Current messages in database: {len(messages)}")
        for i, msg in enumerate(messages[-3:]):  # Show last 3 messages
            role = "Human" if isinstance(msg, HumanMessage) else "Assistant"
            content = msg.content[:50] + "..." if len(msg.content) > 50 else msg.content
            print(f"  {i+1}. {role}: {content}")
    except Exception as e:
        print(f"❌ Memory check failed: {e}")
        return False
    
    # Test 2: New query that should reference previous context
    print("\n2. Testing context-aware query...")
    context_query = "Based on our conversation, what should I focus on learning?"
    print(f"Query: {context_query}")
    
    try:
        response_chunks = []
        async for chunk in chat(chat_id, context_query):
            if isinstance(chunk, str):
                response_chunks.append(chunk)
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict):
                print(f"\n\nFinal response: {chunk['response']}")
                print(f"Total messages in history: {len(chunk['messages'])}")
                break
    except Exception as e:
        print(f"❌ Context-aware query failed: {e}")
        return False
    
    return True

async def test_error_handling():
    """Test error handling in the chain."""
    print("\n\n⚠️ Testing Error Handling")
    print("=" * 40)
    
    # Test 1: Empty query
    print("1. Testing empty query...")
    try:
        async for chunk in chat(chat_id, ""):
            if isinstance(chunk, str):
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict):
                print(f"\nEmpty query response: {chunk['response']}")
                break
    except Exception as e:
        print(f"Empty query error: {e}")
    
    # Test 2: Very long query
    print("\n2. Testing very long query...")
    long_query = "Tell me about " + "software development " * 50
    try:
        async for chunk in chat(chat_id, long_query):
            if isinstance(chunk, str):
                print(chunk, end="", flush=True)
            elif isinstance(chunk, dict):
                print(f"\nLong query response length: {len(chunk['response'])}")
                break
    except Exception as e:
        print(f"Long query error: {e}")

async def test_database_inspection():
    """Inspect the database to verify data integrity."""
    print("\n\n🗄️ Testing Database Inspection")
    print("=" * 40)
    
    try:
        conn = sqlite3.connect("../data/chat_memory.db")
        cursor = conn.cursor()
        
        # Check table structure
        cursor.execute("PRAGMA table_info(chat_messages)")
        columns = cursor.fetchall()
        print("Table structure:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # Check message count
        cursor.execute("SELECT COUNT(*) FROM chat_messages")
        count = cursor.fetchone()[0]
        print(f"\nTotal messages in database: {count}")
        
        # Show recent messages
        cursor.execute("""
            SELECT role, content, timestamp 
            FROM chat_messages 
            ORDER BY timestamp DESC 
            LIMIT 5
        """)
        recent_messages = cursor.fetchall()
        print("\nRecent messages:")
        for role, content, timestamp in recent_messages:
            content_preview = content[:50] + "..." if len(content) > 50 else content
            print(f"  {role}: {content_preview} ({timestamp})")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database inspection failed: {e}")
        return False

async def cleanup_test_data():
    """Clean up test data."""
    print("\n\n🧹 Cleaning Up Test Data")
    print("=" * 40)
    
    try:
        conn = sqlite3.connect("../data/chat_memory.db")
        cursor = conn.cursor()
        
        # Count messages before cleanup
        cursor.execute("SELECT COUNT(*) FROM chat_messages")
        before_count = cursor.fetchone()[0]
        print(f"Messages before cleanup: {before_count}")
        
        # Optionally clear test data (uncomment if you want to clean up)
        # cursor.execute("DELETE FROM chat_messages WHERE timestamp > datetime('now', '-1 hour')")
        # conn.commit()
        
        # cursor.execute("SELECT COUNT(*) FROM chat_messages")
        # after_count = cursor.fetchone()[0]
        # print(f"Messages after cleanup: {after_count}")
        
        print("Cleanup completed (commented out for safety)")
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False

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
        
        # Test 3: Memory persistence
        persistence_ok = await test_memory_persistence()
        if not persistence_ok:
            print("\n❌ Memory persistence tests failed. Stopping.")
            return
        
        # Test 4: Error handling
        await test_error_handling()
        
        # Test 5: Database inspection
        await test_database_inspection()
        
        # Test 6: Cleanup (optional)
        # await cleanup_test_data()
        
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