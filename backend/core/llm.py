from langchain_community.llms import LlamaCpp
from langchain_core.callbacks import StdOutCallbackHandler
from config import MODEL_PATH   
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = LlamaCpp(
    model_path=MODEL_PATH,
    n_ctx=4096,     # User query + retrieved context + conversation history + system prompt
    n_batch=256,        # Number of tokens to process in batch
    temperature=0.1,    # Temperature for randomness in response generation
    max_tokens=512,    # Maximum length of AI response
    streaming=True,     # Stream the response
    verbose=False,
    callbacks=[StdOutCallbackHandler()],
)
