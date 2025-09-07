from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.memory import ConversationBufferMemory
from core.llm import llm
from typing import List, TypedDict
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage
from langgraph.graph import StateGraph, START, END

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

class LLMState(TypedDict):
    messages: List[BaseMessage]
    query: str
    response: str
    memory: ConversationBufferMemory

async def generate_node(state: LLMState):
    """Generate response using LLM with streaming and conversation buffer memory."""
    # Get conversation history from memory
    memory_variables = state["memory"].load_memory_variables({})
    conversation_history = memory_variables.get("history", [])
    
    # Create prompt with system message, conversation history, and current query
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            *conversation_history,
            ("human", state["query"]),
        ]
    )

    response = ""
    chain = prompt | llm | StrOutputParser()
    
    # Stream tokens and yield them for real-time streaming
    async for token in chain.astream({"query": state["query"]}):
        response += token
        # Yield each token for streaming
        yield token

    # Save conversation to memory
    state["memory"].save_context(
        {"input": state["query"]}, 
        {"output": response}
    )

    # Yield the final state update
    yield {
        "response": response,
        "messages": state["messages"] + [HumanMessage(content=state["query"]), AIMessage(content=response)]
    }

def create_graph():
    graph = StateGraph(LLMState)
    graph.add_node("generate", generate_node)
    graph.add_edge(START, "generate")
    graph.add_edge("generate", END)

    return graph.compile()

def create_graph_with_memory():
    """Create a graph with conversation buffer memory."""
    graph = StateGraph(LLMState)
    graph.add_node("generate", generate_node)
    graph.add_edge(START, "generate")
    graph.add_edge("generate", END)

    return graph.compile()

def create_memory():
    """Create a new conversation buffer memory instance."""
    return ConversationBufferMemory(
        memory_key="history",
        return_messages=True,
        output_key="output"
    )

# Create the default graph
graph = create_graph()

# Create a graph with memory capability
graph_with_memory = create_graph_with_memory()

