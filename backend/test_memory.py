import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.graph_memory import create_graph_with_memory, create_memory, graph_with_memory
from core.llm import llm

async def test_conversation_buffer_memory():
    """Test the conversation buffer memory functionality."""
    print("🧠 Testing Conversation Buffer Memory")
    print("=" * 50)
    
    # Create a new memory instance
    memory = create_memory()
    
    # Test 1: Basic memory operations
    print("\n1. Testing basic memory operations:")
    
    # Save some conversation context
    memory.save_context(
        {"input": "My name is Tim and I'm a software developer"},
        {"output": "Nice to meet you, Tim! I'll remember that you're a software developer."}
    )
    
    memory.save_context(
        {"input": "I work with Python and JavaScript"},
        {"output": "That's great! Python and JavaScript are excellent languages for software development."}
    )
    
    # Load and display memory
    memory_variables = memory.load_memory_variables({})
    print(f"Memory content: {memory_variables}")
    
    # Test 2: Test memory with graph
    print("\n2. Testing memory with graph:")
    
    # Create initial state with memory
    initial_state = {
        "messages": [],
        "query": "What do you know about me?",
        "response": "",
        "memory": memory
    }
    
    # Run the graph
    print("Running graph with memory...")
    result = await graph_with_memory.ainvoke(initial_state)
    print(f"Response: {result['response']}")
    
    # Test 3: Follow-up question using memory
    print("\n3. Testing follow-up question:")
    
    follow_up_state = {
        "messages": result["messages"],
        "query": "What programming languages do I work with?",
        "response": "",
        "memory": memory
    }
    
    result2 = await graph_with_memory.ainvoke(follow_up_state)
    print(f"Follow-up response: {result2['response']}")
    
    # Test 4: Check memory persistence
    print("\n4. Testing memory persistence:")
    memory_variables_after = memory.load_memory_variables({})
    print(f"Memory after conversation: {memory_variables_after}")
    
    return memory

async def test_memory_with_streaming():
    """Test memory with streaming responses."""
    print("\n\n🌊 Testing Memory with Streaming")
    print("=" * 50)
    
    memory = create_memory()
    
    # Add some context
    memory.save_context(
        {"input": "I'm building a second brain application"},
        {"output": "That sounds like an interesting project! A second brain application can be very useful for knowledge management."}
    )
    
    initial_state = {
        "messages": [],
        "query": "Tell me about my project and give me some advice",
        "response": "",
        "memory": memory
    }
    
    print("Streaming response:")
    print("-" * 30)
    
    # Test streaming with memory
    async for chunk in graph_with_memory.astream(initial_state):
        if isinstance(chunk, str):
            # This is a streaming token
            print(chunk, end="", flush=True)
        elif isinstance(chunk, dict) and "response" in chunk:
            # This is the final state update
            print(f"\n\nFinal response: {chunk['response']}")
            break

async def test_memory_clearing():
    """Test memory clearing functionality."""
    print("\n\n🗑️ Testing Memory Clearing")
    print("=" * 50)
    
    memory = create_memory()
    
    # Add some data
    memory.save_context(
        {"input": "I have sensitive information"},
        {"output": "I understand you have sensitive information."}
    )
    
    print("Memory before clearing:")
    print(memory.load_memory_variables({}))
    
    # Clear memory
    memory.clear()
    
    print("\nMemory after clearing:")
    print(memory.load_memory_variables({}))

async def test_multiple_conversations():
    """Test multiple separate conversations with different memory instances."""
    print("\n\n💬 Testing Multiple Conversations")
    print("=" * 50)
    
    # Conversation 1: Work-related
    work_memory = create_memory()
    work_memory.save_context(
        {"input": "I'm working on a Python project"},
        {"output": "Python projects are great! What kind of project are you working on?"}
    )
    
    work_state = {
        "messages": [],
        "query": "What should I know about Python best practices?",
        "response": "",
        "memory": work_memory
    }
    
    work_result = await graph_with_memory.ainvoke(work_state)
    print("Work conversation response:")
    print(work_result['response'])
    
    # Conversation 2: Personal (separate memory)
    personal_memory = create_memory()
    personal_memory.save_context(
        {"input": "I love hiking and photography"},
        {"output": "Those are wonderful hobbies! Hiking and photography go great together."}
    )
    
    personal_state = {
        "messages": [],
        "query": "What are some good photography tips?",
        "response": "",
        "memory": personal_memory
    }
    
    personal_result = await graph_with_memory.ainvoke(personal_state)
    print("\nPersonal conversation response:")
    print(personal_result['response'])
    
    # Verify memories are separate
    print("\nWork memory:")
    print(work_memory.load_memory_variables({}))
    print("\nPersonal memory:")
    print(personal_memory.load_memory_variables({}))

async def test_memory_limits():
    """Test memory behavior with longer conversations."""
    print("\n\n📏 Testing Memory Limits")
    print("=" * 50)
    
    memory = create_memory()
    
    # Simulate a longer conversation
    for i in range(5):
        memory.save_context(
            {"input": f"This is message {i+1} in our conversation"},
            {"output": f"I understand this is message {i+1}. I'm keeping track of our conversation."}
        )
    
    print("Memory with 5 conversation turns:")
    memory_vars = memory.load_memory_variables({})
    print(f"Number of messages in memory: {len(memory_vars.get('history', []))}")
    
    # Test with the graph
    state = {
        "messages": [],
        "query": "How many messages have we exchanged?",
        "response": "",
        "memory": memory
    }
    
    result = await graph_with_memory.ainvoke(state)
    print(f"\nResponse about message count: {result['response']}")

async def main():
    """Run all memory tests."""
    print("🚀 Starting LangChain Memory Tests")
    print("=" * 60)
    
    try:
        # Test 1: Basic conversation buffer memory
        memory = await test_conversation_buffer_memory()
        
        # Test 2: Memory with streaming
        await test_memory_with_streaming()
        
        # Test 3: Memory clearing
        await test_memory_clearing()
        
        # Test 4: Multiple conversations
        await test_multiple_conversations()
        
        # Test 5: Memory limits
        await test_memory_limits()
        
        print("\n\n✅ All memory tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Run the tests
    asyncio.run(main())
