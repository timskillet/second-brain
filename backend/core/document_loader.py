from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import CSVLoader

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

def split_docs(docs, chunk_size=1000, chunk_overlap=200):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return text_splitter.split_documents(docs)

