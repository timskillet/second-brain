from langchain.schema import HumanMessage, AIMessage, BaseMessage
from langchain.prompts import ChatPromptTemplate
from core.knowledge_base import load_messages, save_message
from core.llm import llm
from langchain_core.output_parsers import StrOutputParser
from datetime import datetime

SYSTEM_PROMPT = """
<|system|>
You are a "second brain" assistant that helps users by answering questions using provided context.

Instructions:
- Answer the user's question directly and concisely (under 100 words)
- Use the provided context if it's relevant to the question
- If the context doesn't contain relevant information, say "I don't have information about that in my knowledge base"
- Provide a complete, helpful answer
- Do not include any labels like "Human:", "Assistant:", or "AI:" in your response

<|user|>
Context to use for answering:
    {retrieved_context}
Message history:
    {history}
Question: 
    {user_query}

<|assistant|>
"""

def format_history(history: list[BaseMessage]):
    lines = []
    for msg in history:
        if isinstance(msg, HumanMessage):
            lines.append(f"User: {msg.content}")
        elif isinstance(msg, AIMessage):
            lines.append(f"Assistant: {msg.content}")
    return "\n".join(lines) if lines else "None"

async def chat_stream(chat_id: str, user_query: str, retriever=None):
    history = load_messages(chat_id)

    retrieved_context = ""
    if retriever:
        docs = retriever.invoke(user_query)
        if docs:
            seen = set()
            unique_docs = []
            for doc in docs:
                if doc.page_content not in seen:
                    seen.add(doc.page_content)
                    unique_docs.append(doc)
            retrieved_context = "\n\n".join([doc.page_content for doc in unique_docs])
            print(f"Retrieved {len(unique_docs)} unique documents")
        else:
            print("No documents found")
            retrieved_context = "None"

    context_text = retrieved_context if retrieved_context else "None"
    history_text = format_history(history)
    full_prompt = SYSTEM_PROMPT.format(retrieved_context=context_text, history=history_text, user_query=user_query)
    prompt = ChatPromptTemplate.from_messages([("system", full_prompt)])

    print("Prompt sent to LLM:\n", prompt.format_prompt().to_string())
    print("=" * 50)

    chain = prompt | llm | StrOutputParser()

    response = ""
    try:
        async for chunk in chain.astream({}):
            response += chunk
            yield chunk

        save_message(chat_id, "user", user_query)
        save_message(chat_id, "assistant", response)
    except Exception as e:
        print(f"Error in chat: {e}")
        yield {
            "response": "Error processing your request",
            "type": "final_response",
        }

    yield {
        "response": response,
        "type": "final_response",
    }
            