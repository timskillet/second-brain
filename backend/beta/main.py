# backend/beta/main.py
import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from beta.chain import chat
from beta.memory import init_db, load_messages, save_message
from beta.llm import llm

class ChatSession:
    def __init__(self, chat_id: str = None):
        self.chat_id = chat_id or f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.session_start = datetime.now()
        self.message_count = 0
        
    def print_header(self):
        """Print the chat session header."""
        print("=" * 60)
        print("🧠 Second Brain Chat Session")
        print("=" * 60)
        print(f"Chat ID: {self.chat_id}")
        print(f"Started: {self.session_start.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        print("Type 'help' for commands, 'quit' or 'exit' to end session")
        print("=" * 60)
        print()
    
    def print_help(self):
        """Print help information."""
        print("\n�� Available Commands:")
        print("  help, h     - Show this help message")
        print("  quit, exit  - End the chat session")
        print("  clear       - Clear chat history")
        print("  history     - Show chat history")
        print("  stats       - Show session statistics")
        print("  new         - Start a new chat session")
        print("  save        - Save current conversation")
        print("  load <id>   - Load a specific chat session")
        print()
    
    def print_stats(self):
        """Print session statistics."""
        duration = datetime.now() - self.session_start
        print(f"\n�� Session Statistics:")
        print(f"  Chat ID: {self.chat_id}")
        print(f"  Duration: {duration}")
        print(f"  Messages: {self.message_count}")
        print(f"  Started: {self.session_start.strftime('%Y-%m-%d %H:%M:%S')}")
        print()
    
    def print_history(self):
        """Print chat history."""
        try:
            messages = load_messages(self.chat_id)
            if not messages:
                print("\n📝 No chat history found.")
                return
            
            print(f"\n�� Chat History ({len(messages)} messages):")
            print("-" * 40)
            for i, msg in enumerate(messages, 1):
                role = "👤 You" if hasattr(msg, 'type') and msg.type == 'human' else "🤖 Assistant"
                content = msg.content
                # Truncate very long messages
                if len(content) > 100:
                    content = content[:100] + "..."
                print(f"{i:2d}. {role}: {content}")
            print("-" * 40)
        except Exception as e:
            print(f"\n❌ Error loading history: {e}")
    
    def clear_history(self):
        """Clear chat history."""
        try:
            import sqlite3
            conn = sqlite3.connect("data/chat_memory.db")
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chat_messages WHERE chat_id = ?", (self.chat_id,))
            conn.commit()
            conn.close()
            print("\n🗑️ Chat history cleared.")
        except Exception as e:
            print(f"\n❌ Error clearing history: {e}")
    
    def save_conversation(self):
        """Save current conversation."""
        try:
            messages = load_messages(self.chat_id)
            if not messages:
                print("\n�� No conversation to save.")
                return
            
            # Create a simple text file with the conversation
            filename = f"conversation_{self.chat_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(f"Chat Session: {self.chat_id}\n")
                f.write(f"Started: {self.session_start.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Messages: {len(messages)}\n")
                f.write("=" * 50 + "\n\n")
                
                for i, msg in enumerate(messages, 1):
                    role = "Human" if hasattr(msg, 'type') and msg.type == 'human' else "Assistant"
                    f.write(f"{i}. {role}: {msg.content}\n\n")
            
            print(f"\n�� Conversation saved to: {filename}")
        except Exception as e:
            print(f"\n❌ Error saving conversation: {e}")
    
    def load_chat_session(self, chat_id: str):
        """Load a specific chat session."""
        try:
            messages = load_messages(chat_id)
            if not messages:
                print(f"\n❌ No chat session found with ID: {chat_id}")
                return False
            
            self.chat_id = chat_id
            print(f"\n✅ Loaded chat session: {chat_id}")
            print(f"📝 Found {len(messages)} messages in history")
            return True
        except Exception as e:
            print(f"\n❌ Error loading chat session: {e}")
            return False
    
    async def process_user_input(self, user_input: str):
        """Process user input and get AI response."""
        if not user_input.strip():
            return
        
        self.message_count += 1
        print(f"\n👤 You: {user_input}")
        print("🤖 Assistant: ", end="", flush=True)
        
        try:
            response_chunks = []
            async for chunk in chat(self.chat_id, user_input):
                if isinstance(chunk, str):
                    response_chunks.append(chunk)
                    print(chunk, end="", flush=True)
                elif isinstance(chunk, dict):
                    print(f"\n\n[Response completed - {len(chunk['messages'])} total messages]")
                    break
            save_message(self.chat_id, "user", user_input)
        except Exception as e:
            print(f"\n❌ Error getting response: {e}")
    
    async def run(self):
        """Run the interactive chat session."""
        self.print_header()
        
        while True:
            try:
                # Get user input
                user_input = input("\n> ").strip()
                
                # Handle commands
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("\n👋 Goodbye! Thanks for using Second Brain Chat!")
                    break
                elif user_input.lower() in ['help', 'h']:
                    self.print_help()
                    continue
                elif user_input.lower() == 'clear':
                    self.clear_history()
                    continue
                elif user_input.lower() == 'history':
                    self.print_history()
                    continue
                elif user_input.lower() == 'stats':
                    self.print_stats()
                    continue
                elif user_input.lower() == 'new':
                    new_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    self.chat_id = new_id
                    self.session_start = datetime.now()
                    self.message_count = 0
                    print(f"\n🆕 Started new chat session: {new_id}")
                    continue
                elif user_input.lower() == 'save':
                    self.save_conversation()
                    continue
                elif user_input.lower().startswith('load '):
                    chat_id = user_input[5:].strip()
                    if chat_id:
                        self.load_chat_session(chat_id)
                    else:
                        print("\n❌ Please provide a chat ID to load")
                    continue
                elif not user_input:
                    continue
                
                # Process the user input
                await self.process_user_input(user_input)
                
            except KeyboardInterrupt:
                print("\n\n👋 Chat session interrupted. Goodbye!")
                break
            except EOFError:
                print("\n\n�� Chat session ended. Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Unexpected error: {e}")
                continue

async def test_llm_directly():
    """Test the LLM directly without memory."""
    print("�� Testing LLM Directly")
    print("=" * 40)
    
    test_prompts = [
        "Hello, how are you?",
        "What is machine learning?",
        "Explain quantum computing in simple terms",
        "Tell me a joke"
    ]
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n{i}. Testing prompt: {prompt}")
        print("Response: ", end="", flush=True)
        
        try:
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import StrOutputParser
            
            prompt_template = ChatPromptTemplate.from_messages([
                ("human", prompt)
            ])
            
            chain = prompt_template | llm | StrOutputParser()
            
            response = ""
            async for chunk in chain.astream({"input": prompt}):
                response += chunk
                print(chunk, end="", flush=True)
            
            print(f"\n[Response completed - {len(response)} characters]")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
        
        if i < len(test_prompts):
            input("\nPress Enter to continue to next test...")

async def main():
    """Main function to run the chat application."""
    print("🚀 Starting Second Brain Chat Application")
    print("=" * 50)
    
    # Initialize database
    try:
        init_db()
        print("✅ Database initialized")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "test":
            await test_llm_directly()
            return
        elif sys.argv[1] == "help":
            print("\n📚 Usage:")
            print("  python main.py          - Start interactive chat")
            print("  python main.py test     - Test LLM directly")
            print("  python main.py help     - Show this help")
            return
    
    # Start interactive chat session
    session = ChatSession()
    await session.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Application terminated by user")
    except Exception as e:
        print(f"\n❌ Application error: {e}")
        import traceback
        traceback.print_exc()