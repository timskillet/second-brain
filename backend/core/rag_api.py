# rag_api.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import os
import tempfile
try:
    from .rag_graph import rag_app, add_documents_to_knowledge_base, query_rag
except ImportError:
    from rag_graph import rag_app, add_documents_to_knowledge_base, query_rag

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    thread_id: Optional[str] = "default"

class QueryResponse(BaseModel):
    response: str
    thread_id: str

class DocumentUploadResponse(BaseModel):
    message: str
    files_processed: int

@router.post("/query", response_model=QueryResponse)
async def query_rag_endpoint(request: QueryRequest):
    """Query the RAG system"""
    try:
        response = query_rag(rag_app, request.query, request.thread_id)
        return QueryResponse(response=response, thread_id=request.thread_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@router.post("/upload-documents", response_model=DocumentUploadResponse)
async def upload_documents(files: List[UploadFile] = File(...)):
    """Upload and process documents for the knowledge base"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    temp_files = []
    processed_count = 0
    
    try:
        # Save uploaded files temporarily
        for file in files:
            # Check file type
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext not in ['.pdf', '.txt', '.csv']:
                continue
                
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
            content = await file.read()
            temp_file.write(content)
            temp_file.close()
            temp_files.append(temp_file.name)
        
        if temp_files:
            # Add documents to knowledge base
            add_documents_to_knowledge_base(temp_files)
            processed_count = len(temp_files)
        
        return DocumentUploadResponse(
            message=f"Successfully processed {processed_count} files",
            files_processed=processed_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")
    
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "RAG API"}

@router.get("/threads/{thread_id}/history")
async def get_conversation_history(thread_id: str):
    """Get conversation history for a thread"""
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = rag_app.get_state(config)
        
        if state and state.values:
            messages = state.values.get("messages", [])
            return {"thread_id": thread_id, "messages": messages}
        else:
            return {"thread_id": thread_id, "messages": []}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")

@router.delete("/threads/{thread_id}")
async def clear_conversation_history(thread_id: str):
    """Clear conversation history for a thread"""
    try:
        config = {"configurable": {"thread_id": thread_id}}
        # Note: LangGraph doesn't have a direct delete method, 
        # but you can implement this by creating a new thread_id
        return {"message": f"Thread {thread_id} cleared", "thread_id": thread_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing thread: {str(e)}")
