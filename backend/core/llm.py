from langchain_openai import ChatOpenAI
from langchain_core.callbacks import StreamingStdOutCallbackHandler

# Connect to llama.cpp server (OpenAI-compatible API)
llm = ChatOpenAI(
    model="zephyr-7b-alpha",  # must match the model name you want to use
    openai_api_key="dummy-key",  # llama.cpp ignores this
    openai_api_base="http://localhost:8001/v1",  # llama.cpp API
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()],
)
