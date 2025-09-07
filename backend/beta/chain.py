from langchain.schema import HumanMessage, AIMessage
from langchain.prompts import ChatPromptTemplate
from beta.memory import load_messages, save_message
from beta.llm import llm
from langchain_core.output_parsers import StrOutputParser

SYSTEM_PROMPT = """
SYSTEM:
You are a "second brain" memory assistant.

⚠️ NON-NEGOTIABLE RULES:
1. If the answer is not in context/history, reply exactly:
   "I don't have information about that in my knowledge base."
2. Do NOT generate questions or human inputs on behalf of the user.
3. Responses must be under 200 words.
"""

async def chat(chat_id: str, user_query: str):
    # Load previous messages from SQLite
    history = load_messages(chat_id)
    history.append(HumanMessage(content=user_query))

    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT)] + history
    )

    chain = prompt | llm | StrOutputParser()

    response = ""
    async for chunk in chain.astream({"query": user_query}):
        response += chunk
        yield chunk
    
    final_output = StrOutputParser().parse(response)
    save_message(chat_id, "assistant", final_output)
    yield {
        "response": response,
        "messages": history + [AIMessage(content=final_output)]
    }
            