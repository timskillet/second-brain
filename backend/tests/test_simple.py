#!/usr/bin/env python3
"""
Simple test for database and vector store functions without LLM
"""

import os
import sys
import uuid

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from core.knowledge_base import init_db, save_file, get_files, get_file, delete_file

def test_database_functions():
    """Test basic database functions"""
    print("=" * 50)
    print("TESTING DATABASE FUNCTIONS")
    print("=" * 50)
    
    try:
        # Initialize database
        print("1. Initializing database...")
        init_db()
        print("✅ Database initialized successfully")
        
        # Test save_file function
        print("\n2. Testing save_file function...")
        test_id = str(uuid.uuid4())
        test_name = "test_document.txt"
        test_path = "/path/to/test_document.txt"
        
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
            return False
        
        # Test delete_file function
        print("\n5. Testing delete_file function...")
        delete_file(test_name)
        files_after_delete = get_files()
        print(f"✅ File deleted. Remaining files: {len(files_after_delete)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_vector_store_without_llm():
    """Test vector store functions without loading LLM"""
    print("\n" + "=" * 50)
    print("TESTING VECTOR STORE (NO LLM)")
    print("=" * 50)
    
    try:
        # Import only the functions we need
        from core.vector_store import ingest_file_to_knowledge_base
        
        # Create a test file
        print("1. Creating test document...")
        test_content = "This is a test document for machine learning concepts."
        test_file_path = "test_simple.txt"
        
        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write(test_content)
        
        print(f"✅ Created test file: {test_file_path}")
        
        # Test file ingestion
        print("\n2. Testing file ingestion...")
        success = ingest_file_to_knowledge_base(test_file_path)
        
        if success:
            print("✅ File ingested successfully")
            
            # Check if file was saved to database
            files = get_files()
            print(f"✅ Database now contains {len(files)} files")
            
            # Find our test file
            test_file_found = False
            for file in files:
                if file[1] == test_file_path:  # Check by name
                    print(f"✅ Test file found in database: {file}")
                    test_file_found = True
                    break
            
            if not test_file_found:
                print("❌ Test file not found in database")
                return False
                
        else:
            print("❌ File ingestion failed")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Vector store test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            print(f"\n🧹 Cleaned up test file: {test_file_path}")

def main():
    """Run the simple tests"""
    print("🧪 SIMPLE FUNCTION TESTS (NO LLM)")
    print("=" * 60)
    
    # Test database functions
    db_success = test_database_functions()
    
    # Test vector store without LLM
    vs_success = test_vector_store_without_llm()
    
    print("\n" + "=" * 60)
    print("RESULTS:")
    print(f"Database Functions: {'✅ PASSED' if db_success else '❌ FAILED'}")
    print(f"Vector Store:       {'✅ PASSED' if vs_success else '❌ FAILED'}")
    
    if db_success and vs_success:
        print("\n🎉 ALL TESTS PASSED!")
        return True
    else:
        print("\n💥 SOME TESTS FAILED!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
