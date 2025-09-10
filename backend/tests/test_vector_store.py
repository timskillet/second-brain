#!/usr/bin/env python3
"""
Test script for vector store and knowledge base functions
"""

import asyncio
import os
import sys
import time
from pathlib import Path

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from core.knowledge_base import init_db, save_file, get_files, get_file, delete_file
from core.vector_store import ingest_file_to_knowledge_base, create_retriever
from core.chain import chat_stream

def create_test_file(path: str):
    """Create a test text file for ingestion"""
    test_content = """
    Machine Learning Fundamentals
    
    Machine learning is a subset of artificial intelligence that focuses on algorithms 
    that can learn and make decisions from data. There are three main types of machine learning:
    
    1. Supervised Learning: Learning with labeled training data
    2. Unsupervised Learning: Finding patterns in data without labels
    3. Reinforcement Learning: Learning through interaction with an environment
    
    Key concepts include:
    - Training data: The dataset used to train the model
    - Features: Input variables used to make predictions
    - Labels: The target variable we want to predict
    - Model: The algorithm that makes predictions
    
    Common algorithms include linear regression, decision trees, neural networks, 
    and support vector machines.
    """
    test_file_path = path
    with open(test_file_path, "w", encoding="utf-8") as f:
        f.write(test_content)
    
    return test_file_path

def test_knowledge_base():
    """Test knowledge base functions"""
    print("=" * 60)
    print("TESTING KNOWLEDGE BASE FUNCTIONS")
    print("=" * 60)
    
    try:
        # Initialize database
        print("1. Initializing database...")
        init_db()
        print("✅ Database initialized successfully")
        
        # Test save_file function
        print("\n2. Testing save_file function...")
        test_id = "test-file-123"
        test_name = "test_document.txt"
        test_path = "/path/to/test_document.txt"
        
        delete_file(test_name)
        save_file(test_id, test_name, test_path)
        print("✅ File saved successfully")
        
        # Test get_files function
        print("\n3. Testing get_files function...")
        files = get_files()
        print(f"✅ Retrieved {len(files)} files from database")
        for file in files:
            print(f"   - ID: {file[0]}, Name: {file[1]}, Path: {file[2]}")
        
        # Test get_file function
        print("\n4. Testing get_file function...")
        retrieved_file = get_file(test_name)
        if retrieved_file:
            print(f"✅ Retrieved file by name: {retrieved_file}")
        else:
            print("❌ File not found by name")
            
    except Exception as e:
        print(f"❌ Knowledge base test failed: {e}")
        return False
    
    return True

def test_vector_store():
    """Test vector store functions"""
    print("\n" + "=" * 60)
    print("TESTING VECTOR STORE FUNCTIONS")
    print("=" * 60)
    
    try:
        # Create test file
        print("1. Creating test document...")
        test_file_path = create_test_file("test_rag.txt")
        print(f"✅ Created test file: {test_file_path}")
        
        # Test file ingestion
        print("\n2. Testing file ingestion...")
        delete_file(test_file_path)
        success = ingest_file_to_knowledge_base(test_file_path)
        if success:
            print("✅ File ingested successfully")
        else:
            print("❌ File ingestion failed")
            return False
        
        # Test retriever creation
        print("\n3. Testing retriever creation...")
        retriever = create_retriever()
        print("✅ General retriever created successfully")
        
        # Test targeted retriever
        files = get_files()
        if files:
            file_id = files[0][0]  # Get first file ID
            targeted_retriever = create_retriever([file_id])
            print(f"✅ Targeted retriever created for file ID: {file_id}")
        
        # Test retrieval
        print("\n4. Testing document retrieval...")
        test_query = "What are the types of machine learning?"
        docs = retriever.invoke(test_query)
        
        if docs:
            print(f"✅ Retrieved {len(docs)} documents for query: '{test_query}'")
            for i, doc in enumerate(docs):
                print(f"   Document {i+1}: {doc.page_content[:100]}...")
                print(f"   Metadata: {doc.metadata}")
        else:
            print("❌ No documents retrieved")
            return False
            
    except Exception as e:
        print(f"❌ Vector store test failed: {e}")
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            print(f"\n🧹 Cleaned up test file: {test_file_path}")
    
    return True

async def test_chat_with_rag():
    """Test chat functionality with RAG"""
    print("\n" + "=" * 60)
    print("TESTING CHAT WITH RAG")
    print("=" * 60)
    
    try:
        # Create test file and ingest it
        test_file_path = create_test_file("test_rag.txt")
        delete_file(test_file_path)
        ingest_file_to_knowledge_base(test_file_path)
        
        # Create retriever
        retriever = create_retriever()
        
        # Test chat with RAG
        print("1. Testing chat with RAG...")
        test_chat_id = "test-rag-chat"
        test_query = "What are the main types of machine learning?"
        
        print(f"Query: {test_query}")
        print("Response:")
        print("-" * 40)
        
        response_chunks = []
        async for chunk in chat_stream(test_chat_id, test_query, retriever):
            if isinstance(chunk, str):
                print(chunk, end="", flush=True)
                response_chunks.append(chunk)
        
        print("\n" + "-" * 40)
        print("✅ Chat with RAG completed successfully")
        
        # Clean up
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            print(f"🧹 Cleaned up test file: {test_file_path}")
            
    except Exception as e:
        print(f"❌ Chat with RAG test failed: {e}")
        return False
    
    return True

async def main():
    """Run all tests"""
    print("🚀 STARTING VECTOR STORE AND KNOWLEDGE BASE TESTS")
    print("=" * 80)
    
    start_time = time.time()
    
    # Test knowledge base
    kb_success = test_knowledge_base()
    
    # Test vector store
    vs_success = test_vector_store()
    
    # Test chat with RAG
    chat_success = await test_chat_with_rag()
    
    end_time = time.time()
    total_time = end_time - start_time
    
    print("\n" + "=" * 80)
    print("TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"Knowledge Base: {'✅ PASSED' if kb_success else '❌ FAILED'}")
    print(f"Vector Store:   {'✅ PASSED' if vs_success else '❌ FAILED'}")
    print(f"Chat with RAG: {'✅ PASSED' if chat_success else '❌ FAILED'}")
    print(f"Total Time:    {total_time:.2f} seconds")
    
    if all([kb_success, vs_success, chat_success]):
        print("\n🎉 ALL TESTS PASSED!")
        return True
    else:
        print("\n💥 SOME TESTS FAILED!")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
