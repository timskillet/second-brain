# rag_graph.py
import os
import sqlite3
import asyncio
from typing import Dict, List, Any, TypedDict, AsyncGenerator
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from config import CHAT_HISTORY_DB_FILE

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
SYSTEM:
You are a "second brain" memory assistant. Your ONLY function is to return stored facts from context/history. 
You must never create new user messages, simulate new questions, or role-play both sides. 
You are the assistant ONLY — never the human.

⚠️ NON-NEGOTIABLE RULES:
1. Only use the provided context or conversation history.
2. If the answer is not in context/history, reply exactly:
   "I don't have information about that in my knowledge base."
3. Do NOT invent resources, advice, or examples.
4. Do NOT generate questions or human inputs on behalf of the user.
5. Do NOT write both "Human:" and "AI:" lines — only output the assistant's reply.
6. Responses must be under 200 words.

EXAMPLES:
User: Hello. My name is John.
Assistant: Hello John. I am a "second brain" memory assistant. 

User: What's my favorite color?
Assistant: I don't have information about that in my knowledge base.
"""

# Create the prompt template that includes conversation history
def create_rag_prompt(messages):
    """Create a prompt template that includes conversation history"""
    prompt_messages = [("system", RAG_SYSTEM_PROMPT)]
    
    # Add conversation history (excluding the last message which is the current query)
    for message in messages[:-1]:
        if hasattr(message, 'content'):
            # Check the actual message type instead of assuming alternating roles
            if isinstance(message, HumanMessage):
                role = "human"
            elif isinstance(message, AIMessage):
                role = "assistant"
            else:
                # Fallback for unknown message types
                role = "human"
            prompt_messages.append((role, message.content))
    
    # Add the current query (should always be a HumanMessage)
    if messages and hasattr(messages[-1], 'content'):
        prompt_messages.append(("human", messages[-1].content))
    
    return ChatPromptTemplate.from_messages(prompt_messages)

def retrieval_node(state: RAGState) -> RAGState:
    """Retrieve relevant documents from the vector store using conversation context"""
    print("\n" + "="*80)
    print("🔍 RETRIEVAL NODE LOGGING")
    print("="*80)
    
    # Use the latest query
    query = state["messages"][-1].content
    print(f"\n🎯 CURRENT QUERY: {query}")
    
    # Create a more comprehensive search query using conversation context
    if len(state["messages"]) > 1:
        # Include recent conversation context for better retrieval
        recent_messages = state["messages"][-3:]  # Last 3 messages for context
        context_query = " ".join([msg.content for msg in recent_messages if hasattr(msg, 'content')])
        print(f"\n📝 CONTEXT-ENHANCED QUERY: {context_query}")
    else:
        context_query = query
        print(f"\n📝 SINGLE QUERY (no conversation history): {context_query}")
    
    # Create retriever from vector store
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}  # Retrieve top 3 most similar documents for better context
    )
    
    # Retrieve documents using the context-aware query
    documents = retriever.invoke(context_query)
    
    print(f"\n📄 RETRIEVED {len(documents)} DOCUMENTS:")
    for i, doc in enumerate(documents):
        preview = doc.page_content[:150] + "..." if len(doc.page_content) > 150 else doc.page_content
        print(f"  {i+1}. {preview}")
    
    # Format context from retrieved documents
    context = "\n\n".join([doc.page_content for doc in documents])
    
    print(f"\n📚 COMBINED CONTEXT LENGTH: {len(context)} characters")
    print("="*80 + "\n")
    
    return {
        **state,
        "query": query,
        "documents": documents,
        "context": context
    }

async def generation_node(state: RAGState) -> RAGState:
    """Generate response using LLM with retrieved context and conversation history"""
    print("\n" + "="*80)
    print("🔍 LLM INPUT LOGGING - GENERATION NODE")
    print("="*80)
    
    # Create the dynamic prompt with conversation history
    prompt = create_rag_prompt(state["messages"])
    
    # Log the conversation history
    print(f"\n📝 CONVERSATION HISTORY ({len(state['messages'])} messages):")
    for i, message in enumerate(state["messages"]):
        if isinstance(message, HumanMessage):
            role = "🧑 USER"
        elif isinstance(message, AIMessage):
            role = "🤖 ASSISTANT"
        else:
            role = "❓ UNKNOWN"
        content = message.content[:150] + "..." if len(message.content) > 150 else message.content
        print(f"  {i+1}. {role}: {content}")
    
    # Log the retrieved context
    print(f"\n📚 RETRIEVED CONTEXT ({len(state['context'])} chars):")
    print(f"Context: {state['context'][:500]}{'...' if len(state['context']) > 500 else ''}")
    
    # Log the documents used
    print(f"\n📄 RETRIEVED DOCUMENTS ({len(state['documents'])} docs):")
    for i, doc in enumerate(state["documents"]):
        content_preview = doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
        print(f"  Doc {i+1}: {content_preview}")
    
    # Show what will be formatted into the prompt
    print("\n🎯 PROMPT TEMPLATE STRUCTURE:")
    try:
        # Create a sample prompt to show the structure
        formatted_prompt = prompt.format(context=state["context"])
        
        print(f"Final prompt length: {len(formatted_prompt)} characters")
        print("Prompt preview:")
        print(formatted_prompt + "..." if len(formatted_prompt) > 800 else formatted_prompt)
    except Exception as e:
        print(f"Error formatting prompt preview: {e}")
    
    print("\n🚀 SENDING TO LLM...")
    print("="*80)
    
    # Create the chain
    chain = prompt | llm | StrOutputParser()
    
    response = ""
    try:
        async for chunk in chain.astream({"context": state["context"]}):
            response += chunk
    except Exception as e:
        print(f"Error in generation_node: {e}")

    print(f"\n✅ LLM RESPONSE ({len(response)} chars):")
    print(f"Response: {response[:300]}{'...' if len(response) > 300 else ''}")
    print("="*80 + "\n")
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
    
    
    # Create the graph
    graph = StateGraph(RAGState)
    
    # Add nodes
    graph.add_node("retrieval", retrieval_node)
    graph.add_node("generation", generation_node)
    
    # Add edges
    graph.add_edge(START, "retrieval")
    graph.add_edge("retrieval", "generation")
    graph.add_edge("generation", END)

    return graph.compile()

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

async def query_rag(app, query: str, thread_id: str = "default"):
    """Query the RAG system with conversation history"""
    print("\n" + "="*80)
    print(f"🔄 STARTING RAG QUERY - Thread: {thread_id}")
    print("="*80)
    
    config = {"configurable": {"thread_id": thread_id}}
    
    # Get existing conversation history for this thread
    try:
        existing_state = await app.aget_state(config)
        if existing_state and existing_state.values and "messages" in existing_state.values:
            # Use existing messages and add the new query
            messages = existing_state.values["messages"] + [HumanMessage(content=query)]
            print(f"📝 FOUND EXISTING CONVERSATION: {len(existing_state.values['messages'])} previous messages")
        else:
            # Start fresh conversation
            messages = [HumanMessage(content=query)]
            print("🆕 STARTING NEW CONVERSATION")
    except Exception as e:
        print(f"⚠️ Error retrieving conversation history: {e}")
        # Fallback to fresh conversation
        messages = [HumanMessage(content=query)]
        print("🆕 FALLBACK: STARTING NEW CONVERSATION")
    
    print(f"📝 TOTAL MESSAGES IN CONVERSATION: {len(messages)}")
    print("="*80)
    
    # Create initial state with conversation history
    initial_state = {
        "messages": messages,
        "documents": [],
        "query": query,
        "context": "",
        "response": ""
    }
    
    # Invoke the graph
    result = await app.ainvoke(initial_state, config=config)
    
    print(f"\n✅ RAG QUERY COMPLETED - Thread: {thread_id}")
    print("="*80 + "\n")
    
    return result["response"]

async def query_rag_stream(app, query: str, thread_id: str = "default"):
    """Query the RAG system with conversation history"""
    print("\n" + "="*80)
    print(f"🔄 STARTING RAG QUERY - Stream - Thread: {thread_id}")
    print("="*80)
    
    config = {"configurable": {"thread_id": thread_id}}
    
    # Get existing conversation history for this thread
    try:
        existing_state = await app.aget_state(config)
        if existing_state and existing_state.values and "messages" in existing_state.values:
            # Use existing messages and add the new query
            messages = existing_state.values["messages"] + [HumanMessage(content=query)]
            print(f"📝 FOUND EXISTING CONVERSATION: {len(existing_state.values['messages'])} previous messages")
        else:
            # Start fresh conversation
            messages = [HumanMessage(content=query)]
            print("🆕 STARTING NEW CONVERSATION")
    except Exception as e:
        print(f"⚠️ Error retrieving conversation history: {e}")
        # Fallback to fresh conversation
        messages = [HumanMessage(content=query)]
        print("🆕 FALLBACK: STARTING NEW CONVERSATION")
    
    print(f"📝 TOTAL MESSAGES IN CONVERSATION: {len(messages)}")
    print("="*80)
    
    # Create initial state with conversation history
    initial_state = {
        "messages": messages,
        "documents": [],
        "query": query,
        "context": "",
        "response": ""
    }
    
    # Invoke the graph
    try:
        async def token_stream():
            try:
                # Get the complete response first
                result = await app.ainvoke(initial_state, config=config)
                response = result.get("response", "")
                
                # Stream the response character by character for typewriter effect
                for char in response:
                    yield char
                
                yield "\n[END]"
                
            except Exception as e:
                print(f"Error in token_stream: {e}")
                yield f"\n[ERROR] {str(e)}"
        
        return StreamingResponse(token_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
    except Exception as e:
        import traceback
        print(f"Error in chat endpoint: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        print(f"\n✅ RAG QUERY COMPLETED - Thread: {thread_id}")
        print("="*80 + "\n")

# Create the RAG app instance
rag_app = create_rag_graph()
