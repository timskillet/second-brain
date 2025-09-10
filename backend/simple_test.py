#!/usr/bin/env python3
"""
Simple test for save_file() and ingest_file_to_knowledge_base() functions
"""

import os
import sys
import uuid

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.knowledge_base import init_db, save_file, get_files, get_file, delete_file
from core.vector_store import ingest_file_to_knowledge_base

def test_save_file():
    """Test the save_file function"""
    print("Testing save_file() function...")
    
    try:
        # Initialize database
        init_db()
        
        # Test data
        test_id = str(uuid.uuid4())
        test_name = "test_document.txt"
        test_path = "/path/to/test_document.txt"
        
        # Save file
        delete_file(test_name)
        save_file(test_id, test_name, test_path)
        print(f"✅ save_file() successful - ID: {test_id}")
        
        # Verify file was saved
        files = get_files()
        print(f"✅ get_files() returned {len(files)} files")
        
        # Test get_file by name
        retrieved_file = get_file(test_name)
        if retrieved_file:
            print(f"✅ get_file() found file: {retrieved_file}")
        else:
            print("❌ get_file() did not find the file")
            
        return True
        
    except Exception as e:
        print(f"❌ save_file() test failed: {e}")
        return False

def test_ingest_file():
    """Test the ingest_file_to_knowledge_base function"""
    print("\nTesting ingest_file_to_knowledge_base() function...")
    
    try:
        # Create a test file
        test_content = "This is a test document for machine learning concepts."
        test_file_path = "test_ingest.txt"
        delete_file(test_file_path)
        
        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write(test_content)
        
        print(f"✅ Created test file: {test_file_path}")
        
        # Ingest the file
        success = ingest_file_to_knowledge_base(test_file_path)
        
        if success:
            print("✅ ingest_file_to_knowledge_base() successful")
            
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
            print("❌ ingest_file_to_knowledge_base() failed")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ ingest_file() test failed: {e}")
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            print(f"🧹 Cleaned up test file: {test_file_path}")

def main():
    """Run the simple tests"""
    print("🧪 SIMPLE FUNCTION TESTS")
    print("=" * 50)
    
    # Test save_file
    save_success = test_save_file()
    
    # Test ingest_file
    ingest_success = test_ingest_file()
    
    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"save_file(): {'✅ PASSED' if save_success else '❌ FAILED'}")
    print(f"ingest_file_to_knowledge_base(): {'✅ PASSED' if ingest_success else '❌ FAILED'}")
    
    if save_success and ingest_success:
        print("\n🎉 ALL TESTS PASSED!")
        return True
    else:
        print("\n💥 SOME TESTS FAILED!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
