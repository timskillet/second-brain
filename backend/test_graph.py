from core.llm import llm
from langgraph.graph import StateGraph, START, END
from typing import List, TypedDict
from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import asyncio
import time

SYSTEM_PROMPT = """
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
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{query}")
])

chain = prompt | llm | StrOutputParser()

class LLMState(TypedDict):
    messages: List[BaseMessage]
    query: str
    response: str

async def llm_node(state: LLMState):
    response = ""
    async for chunk in chain.astream({"query": state["query"]}):
        response += chunk
        yield chunk
    yield {"response": response}

def create_graph():
    graph = StateGraph(LLMState)
    graph.add_node("generate", llm_node)
    graph.add_edge(START, "generate")
    graph.add_edge("generate", END)
    return graph.compile()

async def test_graph():
    time_start = time.time()
    graph = create_graph()
    async for event in graph.astream_events({"messages": [], "query": "Can you explain backend development?"}, version="v2"):
        if event["event"] == "on_llm_stream":
            print(event["data"]["chunk"].text, end="", flush=True)
    time_end = time.time()
    print(f"\nTime taken: {time_end - time_start} seconds")

async def test_llm():
    time_start = time.time()
    async for chunk in chain.astream("Can you explain backend development?"):
        print(chunk, end="", flush=True)
    time_end = time.time()
    print(f"\nTime taken: {time_end - time_start} seconds")

if __name__ == "__main__":
    asyncio.run(test_graph())