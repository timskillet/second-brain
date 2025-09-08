from core.vector_store import vector_store
from core.chain import chat_stream
from core.chat_history import load_messages, save_message, init_db, clear_messages
from core.document_loader import load_txt, split_docs
import asyncio
import time

retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 2}
)

test_queries = [
    "What is machine learning?",
    "What are the types of machine learning?",
    "What is deep learning?",
    "What are some applications of AI?"
]

# Test query that should NOT be in the knowledge base
non_retrieval_query = "What is quantum computing?"

print("=" * 80)
print("�� SECOND BRAIN RETRIEVAL TEST")
print("=" * 80)

async def test_document_ingestion(filePath):
    try:
        start_time = time.time()
        print("=== Testing Document Ingestion ===")
        print("\nLoading test document...")
        docs = load_txt(filePath)
        print(f"Loaded {len(docs)} document(s)")
        
        print("\nSplitting documents into chunks...")
        split_documents = split_docs(docs, chunk_size=500, chunk_overlap=100)
        print(f"Created {len(split_documents)} chunks")
        
        print("\nAdding documents to vector store...")
        vector_store.add_documents(split_documents)
        print(f"Added {len(split_documents)} document chunks to knowledge base")
        end_time = time.time()
        total_time = end_time - start_time
        print(f"Document ingestion completed in {total_time:.2f} seconds")
    except Exception as e:
        print(f"❌ Document ingestion failed: {e}")
        return False
    
    return True

async def test_vector_store():
    init_db()
    # Clear chat history
    clear_messages("rag_test")
    clear_messages("no_rag_test")

    print("\n📚 Testing retrieval-enabled responses...")
    print("-" * 50)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n�� Test {i}/4: {query}")
        print("⏱️  Starting retrieval + generation...")
        
        start_time = time.time()
        response_chunks = []
        
        async for chunk in chat_stream("rag_test", query, retriever):
            if isinstance(chunk, dict):
                # Final response received
                end_time = time.time()
                total_time = end_time - start_time
                print(f"\n✅ Response completed in {total_time:.2f} seconds")
                print(f"📝 Final response: {chunk['response']}")
            else:
                # Streaming chunk
                print(chunk, end="", flush=True)
                response_chunks.append(chunk)
        
        print(f"\n📊 Total chunks received: {len(response_chunks)}")
        print("-" * 50)
    
    print("\n�� Testing non-retrieval response (should get default message)...")
    print("-" * 50)
    print(f"�� Query: {non_retrieval_query}")
    print("⏱️  Starting generation without retrieval...")
    
    start_time = time.time()
    response_chunks = []
    
    print(f"📝 Final response: \n")
    async for chunk in chat_stream("no_rag_test", non_retrieval_query, None):
        if isinstance(chunk, dict):
            # Final response received
            end_time = time.time()
            total_time = end_time - start_time
            print(f"\n✅ Response completed in {total_time:.2f} seconds")
        else:
            # Streaming chunk
            print(chunk, end="", flush=True)
            response_chunks.append(chunk)
    
    print(f"\n📊 Total chunks received: {len(response_chunks)}")
    print("\n" + "=" * 80)
    print("🎉 ALL TESTS COMPLETED!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_vector_store())