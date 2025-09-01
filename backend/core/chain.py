from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.llm import llm

system_prompt = """
You are a helpful, concise assistant for a personal "second brain". 

IMPORTANT: Respond ONLY with your answer. Do NOT include "Human:" or "Assistant:" labels. Do NOT generate example conversations or questions. Just provide a direct response to what the user asked.

Use the provided context snippets when relevant. If context is missing, say "I don't know".
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{query}"),
])

chain = prompt | llm | StrOutputParser()
