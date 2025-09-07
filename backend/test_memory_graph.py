# backend/test_memory_graph.py
import asyncio
import sys
import os
import sqlite3
import uuid
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.memory_graph import build_graph
from langchain_core.messages import HumanMessage, AIMessage

async def test_basic_graph_functionality():
    """Test basic graph functionality without checkpointing."""
    print("🧠 Testing Basic Graph Functionality")
    print("=" * 50)
    
    # Build the graph
    app = build_graph()
    
    # Test 1: Simple query
    print("\n1. Testing simple query:")
    initial_state = {
        "messages": [],
        "query": "Hello, can you help me understand what a second brain is?",
        "response": ""
    }
    
    print("Running graph...")
    result = await app.ainvoke(initial_state)
    print(f"Response: {result['response']}")
    print(f"Messages count: {len(result['messages'])}")
    
    return app

async def test_checkpointing_with_thread_id():
    """Test checkpointing functionality with thread IDs."""
    print("\n\n�� Testing Checkpointing with Thread ID")
    print("=" * 50)
    
    app = build_graph()
    thread_id = str(uuid.uuid4())
    
    # Test 1: First message in conversation
    print(f"\n1. First message (Thread ID: {thread_id}):")
    config = {"configurable": {"thread_id": thread_id}}
    
    first_state = {
        "messages": [],
        "query": "My name is Tim and I'm a software developer",
        "response": ""
    }
    
    print("Running first message...")
    result1 = await app.ainvoke(first_state, config=config)
    print(f"Response: {result1['response']}")
    
    # Test 2: Follow-up message (should have context)
    print(f"\n2. Follow-up message (Thread ID: {thread_id}):")
    second_state = {
        "messages": result1["messages"],
        "query": "What do you know about me?",
        "response": ""
    }
    
    print("Running follow-up message...")
    result2 = await app.ainvoke(second_state, config=config)
    print(f"Response: {result2['response']}")
    
    # Test 3: Another follow-up
    print(f"\n3. Another follow-up (Thread ID: {thread_id}):")
    third_state = {
        "messages": result2["messages"],
        "query": "What programming languages should I learn?",
        "response": ""
    }
    
    print("Running third message...")
    result3 = await app.ainvoke(third_state, config=config)
    print(f"Response: {result3['response']}")
    
    return thread_id

async def test_streaming_with_checkpointing():
    """Test streaming functionality with checkpointing."""
    print("\n\n🌊 Testing Streaming with Checkpointing")
    print("=" * 50)
    
    app = build_graph()
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    state = {
        "messages": [],
        "query": "Can you explain machine learning in simple terms?",
        "response": ""
    }
    
    print("Streaming response:")
    print("-" * 30)
    
    async for chunk in app.astream(state, config=config):
        if hasattr(chunk, 'content'):
            # This is an AIMessageChunk
            print(chunk.content, end="", flush=True)
        elif isinstance(chunk, dict) and "response" in chunk:
            # This is the final state update
            print(f"\n\nFinal response: {chunk['response']}")
            break

async def test_multiple_conversations():
    """Test multiple separate conversations with different thread IDs."""
    print("\n\n💬 Testing Multiple Conversations")
    print("=" * 50)
    
    app = build_graph()
    
    # Conversation 1: Work-related
    work_thread = str(uuid.uuid4())
    work_config = {"configurable": {"thread_id": work_thread}}
    
    print(f"Work conversation (Thread: {work_thread}):")
    work_state = {
        "messages": [],
        "query": "I'm working on a Python project for data analysis",
        "response": ""
    }
    
    work_result = await app.ainvoke(work_state, config=work_config)
    print(f"Work response: {work_result['response']}")
    
    # Conversation 2: Personal (separate thread)
    personal_thread = str(uuid.uuid4())
    personal_config = {"configurable": {"thread_id": personal_thread}}
    
    print(f"\nPersonal conversation (Thread: {personal_thread}):")
    personal_state = {
        "messages": [],
        "query": "I love hiking and photography",
        "response": ""
    }
    
    personal_result = await app.ainvoke(personal_state, config=personal_config)
    print(f"Personal response: {personal_result['response']}")
    
    # Test that conversations don't interfere
    print(f"\nWork follow-up (should not know about personal):")
    work_followup = {
        "messages": work_result["messages"],
        "query": "What are some good photography tips?",
        "response": ""
    }
    
    work_followup_result = await app.ainvoke(work_followup, config=work_config)
    print(f"Work follow-up response: {work_followup_result['response']}")

async def test_memory_persistence():
    """Test that memory persists across different app instances."""
    print("\n\n🔄 Testing Memory Persistence")
    print("=" * 50)
    
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    # First app instance
    print("1. First app instance:")
    app1 = build_graph()
    
    state1 = {
        "messages": [],
        "query": "I'm building a second brain application",
        "response": ""
    }
    
    result1 = await app1.ainvoke(state1, config=config)
    print(f"Response: {result1['response']}")
    
    # Second app instance (should remember previous conversation)
    print("\n2. Second app instance (should remember):")
    app2 = build_graph()
    
    state2 = {
        "messages": [],
        "query": "What was I working on?",
        "response": ""
    }
    
    result2 = await app2.ainvoke(state2, config=config)
    print(f"Response: {result2['response']}")

async def test_database_inspection():
    """Test and inspect the SQLite database."""
    print("\n\n🗄️ Testing Database Inspection")
    print("=" * 50)
    
    # Connect to the database
    conn = sqlite3.connect("data/chat_history.db")
    cursor = conn.cursor()
    
    # Check if tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables in database: {[table[0] for table in tables]}")
    
    # Check checkpoints table
    try:
        cursor.execute("SELECT COUNT(*) FROM checkpoints")
        checkpoint_count = cursor.fetchone()[0]
        print(f"Number of checkpoints: {checkpoint_count}")
        
        # Show recent checkpoints
        cursor.execute("""
            SELECT thread_id, checkpoint_id, created_at 
            FROM checkpoints 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent_checkpoints = cursor.fetchall()
        print("\nRecent checkpoints:")
        for thread_id, checkpoint_id, created_at in recent_checkpoints:
            print(f"  Thread: {thread_id}, Checkpoint: {checkpoint_id}, Created: {created_at}")
            
    except sqlite3.OperationalError as e:
        print(f"Error accessing checkpoints table: {e}")
    
    conn.close()

async def test_error_handling():
    """Test error handling in the graph."""
    print("\n\n⚠️ Testing Error Handling")
    print("=" * 50)
    
    app = build_graph()
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    # Test with empty query
    print("1. Testing empty query:")
    empty_state = {
        "messages": [],
        "query": "",
        "response": ""
    }
    
    try:
        result = await app.ainvoke(empty_state, config=config)
        print(f"Empty query response: {result['response']}")
    except Exception as e:
        print(f"Error with empty query: {e}")
    
    # Test with very long query
    print("\n2. Testing very long query:")
    long_query = "Tell me about " + "software development " * 100
    long_state = {
        "messages": [],
        "query": long_query,
        "response": ""
    }
    
    try:
        result = await app.ainvoke(long_state, config=config)
        print(f"Long query response length: {len(result['response'])}")
    except Exception as e:
        print(f"Error with long query: {e}")

async def test_concurrent_requests():
    """Test concurrent requests to the same thread."""
    print("\n\n⚡ Testing Concurrent Requests")
    print("=" * 50)
    
    app = build_graph()
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    async def make_request(query, request_id):
        state = {
            "messages": [],
            "query": f"Request {request_id}: {query}",
            "response": ""
        }
        result = await app.ainvoke(state, config=config)
        return f"Request {request_id}: {result['response'][:50]}..."
    
    # Make concurrent requests
    tasks = [
        make_request("What is Python?", 1),
        make_request("Explain databases", 2),
        make_request("Tell me about APIs", 3)
    ]
    
    results = await asyncio.gather(*tasks)
    for result in results:
        print(result)

async def cleanup_test_data():
    """Clean up test data from the database."""
    print("\n\n🧹 Cleaning Up Test Data")
    print("=" * 50)
    
    conn = sqlite3.connect("data/chat_history.db")
    cursor = conn.cursor()
    
    try:
        # Count checkpoints before cleanup
        cursor.execute("SELECT COUNT(*) FROM checkpoints")
        before_count = cursor.fetchone()[0]
        print(f"Checkpoints before cleanup: {before_count}")
        
        # Delete test checkpoints (you might want to be more selective)
        # cursor.execute("DELETE FROM checkpoints WHERE created_at > datetime('now', '-1 hour')")
        # conn.commit()
        
        # cursor.execute("SELECT COUNT(*) FROM checkpoints")
        # after_count = cursor.fetchone()[0]
        # print(f"Checkpoints after cleanup: {after_count}")
        
        print("Cleanup completed (commented out for safety)")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
    finally:
        conn.close()

async def main():
    """Run all memory graph tests."""
    print("🚀 Starting Memory Graph Tests")
    print("=" * 60)
    
    try:
        # Test 1: Basic functionality
        app = await test_basic_graph_functionality()
        
        # Test 2: Checkpointing with thread ID
        thread_id = await test_checkpointing_with_thread_id()
        
        # Test 3: Streaming with checkpointing
        await test_streaming_with_checkpointing()
        
        # Test 4: Multiple conversations
        await test_multiple_conversations()
        
        # Test 5: Memory persistence
        await test_memory_persistence()
        
        # Test 6: Database inspection
        await test_database_inspection()
        
        # Test 7: Error handling
        await test_error_handling()
        
        # Test 8: Concurrent requests
        await test_concurrent_requests()
        
        # Test 9: Cleanup (optional)
        # await cleanup_test_data()
        
        print("\n\n✅ All memory graph tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Run the tests
    asyncio.run(main())