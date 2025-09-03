from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import AIMessage
from core.llm import llm

system_prompt = """
You are a helpful, concise assistant for a personal "second brain".
IMPORTANT: Respond ONLY with your answer. Do NOT include "Human:" or "Assistant:" labels. 
If context is missing, say "I don't know".
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{query}"),
])

parser = StrOutputParser()

chain = prompt | llm | parser

# This is now your LangGraph node
def rag_node(state):
    query = state["messages"][-1].content  # last user message
    response = (prompt | llm | parser).invoke({"query": query})
    return {"messages": state["messages"] + [AIMessage(content=response)]}