# RAG System with LangGraph, SQLite, and ChromaDB

This implementation provides a complete Retrieval-Augmented Generation (RAG) system using:

- **LangGraph** for orchestration and conversation flow
- **SQLite** for conversation memory persistence
- **ChromaDB** for vector storage and similarity search
- **HuggingFace Embeddings** for document vectorization

## Architecture

```
User Query → Retrieval Node → Generation Node → Response
     ↓              ↓              ↓
  SQLite        ChromaDB        LLM (LlamaCpp)
(Memory)      (Vector Store)   (Response Gen)
```

## Components

### 1. RAG Graph (`rag_graph.py`)

- **State Management**: Uses TypedDict for type-safe state
- **Retrieval Node**: Searches ChromaDB for relevant documents
- **Generation Node**: Uses LLM with retrieved context
- **SQLite Checkpointer**: Persists conversation history

### 2. Vector Store (`vector_store.py`)

- ChromaDB instance with persistent storage
- Collection name: "second_brain"
- Persist directory: "./chroma_db"

### 3. Document Processing (`document_loader.py`)

- Supports PDF, TXT, and CSV files
- Text splitting with configurable chunk size and overlap
- Automatic document chunking for better retrieval

### 4. API Endpoints (`rag_api.py`)

- `/api/rag/query` - Query the RAG system
- `/api/rag/upload-documents` - Upload documents to knowledge base
- `/api/rag/threads/{thread_id}/history` - Get conversation history
- `/api/rag/health` - Health check

## Usage

### 1. Add Documents to Knowledge Base

```python
from core.rag_graph import add_documents_to_knowledge_base

# Add documents
file_paths = ["document1.pdf", "document2.txt", "data.csv"]
add_documents_to_knowledge_base(file_paths)
```

### 2. Query the RAG System

```python
from core.rag_graph import query_rag, rag_app

# Query with conversation memory
response = query_rag(rag_app, "What is the main topic?", thread_id="user123")
print(response)
```

### 3. API Usage

#### Upload Documents

```bash
curl -X POST "http://localhost:8000/api/rag/upload-documents" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@document1.pdf" \
  -F "files=@document2.txt"
```

#### Query RAG System

```bash
curl -X POST "http://localhost:8000/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the main topic?", "thread_id": "user123"}'
```

## Configuration

### Environment Variables

- `MODEL_PATH`: Path to your LlamaCpp model file
- `HOST`: Server host (default: localhost)
- `PORT`: Server port (default: 8000)

### Model Configuration

- **Embeddings**: sentence-transformers/all-MiniLM-L6-v2
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Retrieval**: Top 4 most similar documents

## File Structure

```
backend/core/
├── rag_graph.py          # Main RAG implementation
├── rag_api.py            # FastAPI endpoints
├── rag_test.py           # Test script
├── vector_store.py       # ChromaDB configuration
├── embeddings.py         # HuggingFace embeddings
├── document_loader.py    # Document processing
├── llm.py               # LlamaCpp configuration
└── README_RAG.md        # This file
```

## Testing

Run the test script:

```bash
cd backend/core
python rag_test.py
```

## Features

- ✅ **Conversation Memory**: SQLite persistence across sessions
- ✅ **Document Upload**: Support for PDF, TXT, CSV files
- ✅ **Vector Search**: ChromaDB similarity search
- ✅ **Context-Aware**: Uses retrieved documents for responses
- ✅ **Thread Management**: Separate conversation threads
- ✅ **API Integration**: RESTful endpoints for frontend
- ✅ **Error Handling**: Comprehensive error management

## Dependencies

```
langgraph
langchain-core
langchain-community
langchain-chroma
sentence-transformers
chromadb
fastapi
uvicorn
python-multipart
```

## Next Steps

1. **Add more document types** (Word, PowerPoint, etc.)
2. **Implement document metadata** (source, date, etc.)
3. **Add document deletion** functionality
4. **Implement conversation summarization**
5. **Add document re-indexing** capabilities
6. **Implement user authentication** and document access control
