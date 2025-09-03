from langchain_huggingface import HuggingFaceEmbeddings
import torch

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "trust_remote_code": True
    },
    encode_kwargs={
        "batch_size": 32,
        "normalize_embeddings": True
    }
)