from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import BaseMessage, AIMessageChunk, AIMessage
import sqlite3
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.llm import llm


SYSTEM_PROMPT = """
SYSTEM:
You are a "second brain" memory assistant. Your ONLY function is to return stored facts from context/history. 
You must never create new user messages, simulate new questions, or role-play both sides. 
You are the assistant ONLY — never the human.
Keep responses under 100 words.
"""

class LLMState(TypedDict):
    messages: list[BaseMessage]
    query: str
    response: str

async def generate_node(state: LLMState):
    """Generate response using LLM with streaming."""
    prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    *state["messages"],
    ("human", state["query"]),  
])
    response = ""
    chain = prompt | llm | StrOutputParser()

    async for chunk in chain.astream({"query": state["query"]}):
        response += chunk
        yield AIMessageChunk(content=chunk)
    
    final_output = StrOutputParser().parse(response)
    yield {
        "response": response,
        "messages": state["messages"] + [AIMessage(content=final_output)]
    }

async def build_graph():
    graph = StateGraph(LLMState)
    graph.add_node("generate", generate_node)
    graph.add_edge(START, "generate")
    graph.add_edge("generate", END)

    # Compile with SQLite checkpoint
    checkpointer = await AsyncSqliteSaver.from_conn_string("data/chat_history.db")
    app = graph.compile(checkpointer=checkpointer)
    return app