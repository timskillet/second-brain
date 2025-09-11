from langchain_chroma import Chroma
from core.embeddings import embeddings
from core.document_loader import load_pdf, load_txt, load_csv, split_docs
from core.knowledge_base import save_file
from typing import List
import os
import uuid
from config import CHROMA_DB_FILE

vector_store = Chroma(
    collection_name="second_brain",
    persist_directory=CHROMA_DB_FILE,
    embedding_function=embeddings
)

# Function to add document to the knowledge base
def ingest_file_to_knowledge_base(file_path: str) -> bool:
    """Add a document to the vector store"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False

    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext == '.pdf':
        docs = load_pdf(file_path)
    elif file_ext == '.txt':
        docs = load_txt(file_path)
    elif file_ext == '.csv':
        docs = load_csv(file_path)
    else:
        print(f"Unsupported file type: {file_ext}")
        return False

    # Save file to knowledge database
    id = str(uuid.uuid4())
    name = os.path.basename(file_path)
    save_file(id, name, file_path)

    split_docs_list = split_docs(docs, chunk_size=500, chunk_overlap=100)
    metadata = {
        "id": id,
        "name": name,
        "file_type": file_ext
    }

    if split_docs_list:
        # Add metadata to each document chunk
        for doc in split_docs_list:
            doc.metadata.update(metadata)
        
        vector_store.add_documents(split_docs_list)
        print(f"Added {len(split_docs_list)} document chunks to knowledge base")
    else:
        print("No documents were added to the knowledge base")
        return False
    return True

def create_retriever(file_ids: List[str] = None):
    """Create a retriever from the files referenced"""
    if file_ids:
        retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 5 * len(file_ids),
                "filter": {
                    "id": {"$in": file_ids}
                }
            }
        )
    else:
        retriever = None
    return retriever