# rag_graph.py
import os
import sqlite3
from typing import Dict, List, Any, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

try:
    # Try relative imports first (when used as a module)
    from .llm import llm
    from .embeddings import embeddings
    from .vector_store import vector_store
    from .document_loader import load_pdf, load_txt, load_csv, split_docs
except ImportError:
    # Fall back to absolute imports (when run directly)
    from llm import llm
    from embeddings import embeddings
    from vector_store import vector_store
    from document_loader import load_pdf, load_txt, load_csv, split_docs

# Define the state schema
class RAGState(TypedDict):
    messages: List[BaseMessage]
    documents: List[Document]
    query: str
    context: str
    response: str

# System prompt for RAG
RAG_SYSTEM_PROMPT = """
You are a helpful assistant for a personal "second brain" system.

Instructions:
- Use the provided context to answer questions accurately
- Consider the conversation history when providing responses
- If context doesn't contain relevant information, say "I don't have information about that in my knowledge base"
- Be concise and direct
- Keep responses under 200 words
- Reference previous parts of the conversation when relevant

Context from knowledge base: {context}
"""

# Create the prompt template that includes conversation history
def create_rag_prompt(messages):
    """Create a prompt template that includes conversation history"""
    prompt_messages = [("system", RAG_SYSTEM_PROMPT)]
    
    # Add conversation history (excluding the last message which is the current query)
    for i, message in enumerate(messages[:-1]):
        if hasattr(message, 'content'):
            role = "human" if i % 2 == 0 else "assistant"
            prompt_messages.append((role, message.content))
    
    # Add the current query
    if messages and hasattr(messages[-1], 'content'):
        prompt_messages.append(("human", messages[-1].content))
    
    return ChatPromptTemplate.from_messages(prompt_messages)

def retrieval_node(state: RAGState) -> RAGState:
    """Retrieve relevant documents from the vector store using conversation context"""
    # Use the latest query
    query = state["messages"][-1].content
    
    # Create a more comprehensive search query using conversation context
    if len(state["messages"]) > 1:
        # Include recent conversation context for better retrieval
        recent_messages = state["messages"][-3:]  # Last 3 messages for context
        context_query = " ".join([msg.content for msg in recent_messages if hasattr(msg, 'content')])
    else:
        context_query = query
    
    # Create retriever from vector store
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}  # Retrieve top 3 most similar documents for better context
    )
    
    # Retrieve documents using the context-aware query
    documents = retriever.invoke(context_query)
    
    # Format context from retrieved documents
    context = "\n\n".join([doc.page_content for doc in documents])

    print("=================================== RETRIEVAL NODE ===================================")
    print({
        "query": query,
        "documents": documents,
        "context": context
    })
    
    return {
        **state,
        "query": query,
        "documents": documents,
        "context": context
    }

def generation_node(state: RAGState) -> RAGState:
    """Generate response using LLM with retrieved context and conversation history"""
    # Create the dynamic prompt with conversation history
    prompt = create_rag_prompt(state["messages"])
    
    # Create the chain
    chain = prompt | llm | StrOutputParser()
    
    # Generate response
    response = chain.invoke({
        "context": state["context"]
    })
    
    return {
        **state,
        "response": response,
        "messages": state["messages"] + [AIMessage(content=response)]
    }

def should_continue(state: RAGState) -> str:
    """Determine if we should continue or end"""
    return "end"

# Create the graph
def create_rag_graph():
    """Create and return the RAG graph"""
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    # Create SQLite connection for checkpointer
    conn = sqlite3.connect("data/chat_history.db", check_same_thread=False)
    checkpointer = SqliteSaver(conn)
    
    # Create the graph
    graph = StateGraph(RAGState)
    
    # Add nodes
    graph.add_node("retrieval", retrieval_node)
    graph.add_node("generation", generation_node)
    
    # Add edges
    graph.add_edge(START, "retrieval")
    graph.add_edge("retrieval", "generation")
    graph.add_edge("generation", END)
    
    # Compile with checkpointer
    app = graph.compile(checkpointer=checkpointer)
    
    return app

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

# Function to query the RAG system
def query_rag(app, query: str, thread_id: str = "default"):
    """Query the RAG system with conversation history"""
    config = {"configurable": {"thread_id": thread_id}}
    
    # Get existing conversation history for this thread
    try:
        existing_state = app.get_state(config)
        if existing_state and existing_state.values and "messages" in existing_state.values:
            # Use existing messages and add the new query
            messages = existing_state.values["messages"] + [HumanMessage(content=query)]
        else:
            # Start fresh conversation
            messages = [HumanMessage(content=query)]
    except Exception as e:
        print(f"Error retrieving conversation history: {e}")
        # Fallback to fresh conversation
        messages = [HumanMessage(content=query)]
    
    # Create initial state with conversation history
    initial_state = {
        "messages": messages,
        "documents": [],
        "query": query,
        "context": "",
        "response": ""
    }
    
    # Invoke the graph
    result = app.invoke(initial_state, config=config)
    
    return result["response"]

# Create the RAG app instance
rag_app = create_rag_graph()
