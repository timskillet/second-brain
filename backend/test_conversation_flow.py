#!/usr/bin/env python3
"""
Test script to verify RAG conversation flow with history
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.rag_graph import query_rag, rag_app

def test_conversation_flow():
    """Test that conversation history is maintained and used across queries"""
    thread_id = "test_conversation_123"
    
    print("Testing RAG conversation flow with history...")
    print("=" * 60)
    
    # First query
    print("\n1. First query:")
    query1 = "What is machine learning?"
    response1 = query_rag(rag_app, query1, thread_id)
    print(f"Query: {query1}")
    print(f"Response: {response1[:200]}...")
    
    # Second query that should reference the first
    print("\n2. Follow-up query (should reference previous answer):")
    query2 = "Can you give me more details about that?"
    response2 = query_rag(rag_app, query2, thread_id)
    print(f"Query: {query2}")
    print(f"Response: {response2[:200]}...")
    
    # Third query
    print("\n3. Another follow-up:")
    query3 = "What are the main types of machine learning?"
    response3 = query_rag(rag_app, query3, thread_id)
    print(f"Query: {query3}")
    print(f"Response: {response3[:200]}...")
    
    # Fourth query to test context awareness
    print("\n4. Context-aware query:")
    query4 = "Which type is most commonly used in practice?"
    response4 = query_rag(rag_app, query4, thread_id)
    print(f"Query: {query4}")
    print(f"Response: {response4[:200]}...")
    
    # Check conversation history
    print("\n5. Checking conversation history:")
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = rag_app.get_state(config)
        if state and state.values and "messages" in state.values:
            messages = state.values["messages"]
            print(f"Total messages in conversation: {len(messages)}")
            print("\nFull conversation history:")
            for i, msg in enumerate(messages):
                role = "User" if hasattr(msg, 'content') and i % 2 == 0 else "Assistant"
                content = msg.content[:150] + "..." if len(msg.content) > 150 else msg.content
                print(f"  {i+1}. {role}: {content}")
        else:
            print("No conversation history found")
    except Exception as e:
        print(f"Error retrieving history: {e}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    
    # Test with a new thread to ensure isolation
    print("\n6. Testing thread isolation:")
    new_thread_id = "test_conversation_456"
    query5 = "What did we discuss earlier?"
    response5 = query_rag(rag_app, query5, new_thread_id)
    print(f"New thread query: {query5}")
    print(f"Response (should not reference previous conversation): {response5[:200]}...")

def test_context_awareness():
    """Test specific context awareness scenarios"""
    thread_id = "context_test_789"
    
    print("\n" + "=" * 60)
    print("Testing Context Awareness...")
    print("=" * 60)
    
    # Scenario 1: Building on previous information
    print("\nScenario 1: Building on previous information")
    query1 = "My name is John and I'm a software engineer."
    response1 = query_rag(rag_app, query1, thread_id)
    print(f"User: {query1}")
    print(f"Assistant: {response1[:200]}...")
    
    query2 = "What's my profession?"
    response2 = query_rag(rag_app, query2, thread_id)
    print(f"User: {query2}")
    print(f"Assistant: {response2[:200]}...")
    
    # Scenario 2: Referencing previous topics
    print("\nScenario 2: Referencing previous topics")
    query3 = "I'm interested in learning Python."
    response3 = query_rag(rag_app, query3, thread_id)
    print(f"User: {query3}")
    print(f"Assistant: {response3[:200]}...")
    
    query4 = "What programming language should I learn first?"
    response4 = query_rag(rag_app, query4, thread_id)
    print(f"User: {query4}")
    print(f"Assistant: {response4[:200]}...")
    
    print("\n" + "=" * 60)
    print("Context awareness test completed!")

if __name__ == "__main__":
    try:
        test_conversation_flow()
        test_context_awareness()
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()
