from langchain_chroma import Chroma

vector_store = Chroma(
    collection_name="second_brain",
    persist_directory="./chroma_db"
)