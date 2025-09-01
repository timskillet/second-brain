from langchain_community.llms import LlamaCpp
from langchain_core.callbacks import StdOutCallbackHandler
from config import MODEL_PATH   

llm = LlamaCpp(
    model_path=MODEL_PATH,
    n_context=2048,
    n_batch=256,
    temperature=0.1,
    max_tokens=512,
    verbose=True,
    streaming=True,
    callback_manager=[StdOutCallbackHandler()],
)