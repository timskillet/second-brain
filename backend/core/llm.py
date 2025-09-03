from langchain_community.llms import LlamaCpp
from langchain_core.callbacks import StdOutCallbackHandler
from config import MODEL_PATH   

llm = LlamaCpp(
    model_path=MODEL_PATH,
    n_ctx=2048,     # User query + retrieved context + conversation history + system prompt
    n_batch=256,        # Number of tokens to process in batch
    temperature=0.1,    # Temperature for randomness in response generation
    max_tokens=512,    # Maximum length of AI response
    verbose=True,
    streaming=True,     # Stream the response
    callback_manager=[StdOutCallbackHandler()],
)