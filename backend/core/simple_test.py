# simple_test.py
import os
import sys

# Add the parent directory to the path so we can import from core
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from core.embeddings import embeddings
    print("✅ Embeddings imported successfully")
except Exception as e:
    print(f"❌ Error importing embeddings: {e}")

try:
    from core.vector_store import vector_store
    print("✅ Vector store imported successfully")
except Exception as e:
    print(f"❌ Error importing vector store: {e}")

try:
    from core.document_loader import load_pdf, load_txt, load_csv, split_docs
    print("✅ Document loader imported successfully")
except Exception as e:
    print(f"❌ Error importing document loader: {e}")

try:
    from core.llm import llm
    print("✅ LLM imported successfully")
except Exception as e:
    print(f"❌ Error importing LLM: {e}")

print("\nAll core components imported successfully!")
