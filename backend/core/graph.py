from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage
from core.llm import llm
from typing import List, TypedDict
from langchain_core.messages import BaseMessage, Document
from core.vector_store import vector_store
import os
import sqlite3
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver
from config import CHAT_HISTORY_DB_FILE

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
- If context doesn't contain relevant information, say "I don't have information about that in my knowledge base"
- Be concise and direct
- Keep responses under 200 words

Context: {context}

Question: {query}
"""

# Create the prompt template
rag_prompt = ChatPromptTemplate.from_messages([
    ("system", RAG_SYSTEM_PROMPT),
    ("human", "{query}")
])

parser = StrOutputParser()

def retrieval_node(state: RAGState) -> RAGState:
    """Retrieve relevant documents from the vector store"""
    query = state["messages"][-1].content
    
    # Create retriever from vector store
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 2}  # Retrieve top 2 most similar documents
    )
    
    # Retrieve documents
    documents = retriever.invoke(query)
    
    # Format context from retrieved documents
    context = "\n\n".join([doc.page_content for doc in documents])
    
    return {
        **state,
        "query": query,
        "documents": documents,
        "context": context
    }

def generation_node(state: RAGState) -> RAGState:
    """Generate response using LLM with retrieved context"""
    # Create the chain
    chain = rag_prompt | llm | StrOutputParser()
    
    # Generate response
    response = chain.invoke({
        "query": state["query"],
        "context": state["context"]
    })
    
    return {
        **state,
        "response": response,
        "messages": state["messages"] + [AIMessage(content=response)]
    }

# Create the graph
def create_rag_graph():
    """Create and return the RAG graph"""
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    # Create SQLite connection for checkpointer
    conn = sqlite3.connect(CHAT_HISTORY_DB_FILE, check_same_thread=False)
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

graph = create_rag_graph()