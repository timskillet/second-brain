from langchain_chroma import Chroma
from embeddings import embeddings

vector_store = Chroma(
    collection_name="second_brain",
    persist_directory="/data/chroma_db",
    embedding_function=embeddings
)