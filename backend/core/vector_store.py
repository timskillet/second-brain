from langchain_chroma import Chroma
from config import CHROMA_DB_FILE
from core.embeddings import embeddings
from core.document_loader import load_pdf, load_txt, load_csv, split_docs
from typing import List
import os

vector_store = Chroma(
    collection_name="second_brain",
    persist_directory=CHROMA_DB_FILE,
    embedding_function=embeddings
)

# Function to add documents to the knowledge base
def add_documents_to_knowledge_base(file_paths: List[str]):
    """Add documents to the vector store"""
    all_documents = []
    
    for file_path in file_paths:
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue
            
        file_ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_ext == '.pdf':
                docs = load_pdf(file_path)
            elif file_ext == '.txt':
                docs = load_txt(file_path)
            elif file_ext == '.csv':
                docs = load_csv(file_path)
            else:
                print(f"Unsupported file type: {file_ext}")
                continue
                
            # Split documents into chunks
            split_docs_list = split_docs(docs, chunk_size=500, chunk_overlap=100)
            all_documents.extend(split_docs_list)
            
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            continue
    
    if all_documents:
        # Add documents to vector store
        vector_store.add_documents(all_documents)
        print(f"Added {len(all_documents)} document chunks to knowledge base")
    else:
        print("No documents were added to the knowledge base")