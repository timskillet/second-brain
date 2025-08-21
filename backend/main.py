from langchain_openai import ChatOpenAI


print("Starting...")
# Connect to llama.cpp server (OpenAI-compatible API)
llm = ChatOpenAI(
    model="zephyr-7b-alpha",  # must match the model name you want to use
    openai_api_key="dummy-key",  # llama.cpp ignores this
    openai_api_base="http://localhost:8001/v1",  # llama.cpp API
)

# Simple interaction
response = llm.invoke("Hello, can you tell me a fun fact?")
print(response.content)
