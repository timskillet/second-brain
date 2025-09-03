# test_rag.py
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'core'))

from core.rag_graph import rag_app, add_documents_to_knowledge_base, query_rag

def test_rag_system():
    """Test the RAG system"""
    
    # Example: Add some documents to the knowledge base
    sample_files = [
        "files/sample.txt",
    ]
    
    if sample_files:
        print("Adding documents to knowledge base...")
        add_documents_to_knowledge_base(sample_files)
    
    # Test queries
    test_queries = [
        "What is the main topic of the documents?",
        "Can you summarize the key points?",
        "What are the important details mentioned?",
    ]
    
    print("\nTesting RAG system...")
    for i, query in enumerate(test_queries, 1):
        print(f"\n--- Query {i} ---")
        print(f"Question: {query}")
        
        try:
            response = query_rag(rag_app, query, thread_id=f"test_{i}")
            print(f"Answer: {response}")
        except Exception as e:
            print(f"Error: {e}")
    
    print("\nRAG system test completed!")

if __name__ == "__main__":
    test_rag_system()
