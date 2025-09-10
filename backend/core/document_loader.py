from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

def load_pdf(path):
    pdf_loader = PyPDFLoader(path)
    docs = pdf_loader.load()
    return docs

def load_txt(path):
    txt_loader = TextLoader(path)
    docs = txt_loader.load()
    return docs

def load_csv(path):
    csv_loader = CSVLoader(path)
    docs = csv_loader.load()
    return docs

def split_docs(docs, chunk_size=1600, chunk_overlap=300):
    text_splitter = text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,          # max characters per chunk
        chunk_overlap=chunk_overlap,    # character overlap between chunks
        separators=["\n\n", "\n", ". ", "!", "?", " ", ""]
    )
    return text_splitter.split_documents(docs)

