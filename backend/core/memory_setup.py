# memory_setup.py
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage, AIMessage

# Define your state schema (conversations stored as a list of messages)
def add_message(state, message):
    return {"messages": state.get("messages", []) + [message]}

# Graph setup
graph = StateGraph(dict)

@graph.add_node
def chat_node(state):
    last_msg = state["messages"][-1]
    return {"messages": state["messages"] + [AIMessage(content=f"Echo: {last_msg.content}")]}

graph.add_edge(START, "chat_node")
graph.add_edge("chat_node", END)
conn = sqlite3.connect("data/chat_memory.db", check_same_thread=False)

with SqliteSaver(conn) as checkpointer:
    app = graph.compile(checkpointer=checkpointer)
