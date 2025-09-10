# 🧠 Second Brain - AI-Powered Knowledge Management System

A powerful desktop application that serves as your personal AI-powered second brain, helping you manage, search, and interact with your knowledge base using advanced retrieval-augmented generation (RAG) technology.

## ✨ Features
### 🤖 **AI-Powered Chat**

- **Context-Aware Responses**: AI answers questions using your uploaded documents
- **File References**: Reference specific documents using `@filename` syntax
- **Command System**: Built-in commands for enhanced functionality
- **Chat History**: Persistent conversation history with multiple chat sessions
- **Streaming Responses**: Real-time AI response streaming

### 🔍 **Advanced Search & Retrieval**
- **Semantic Search**: Find relevant information using natural language queries
- **Vector Database**: ChromaDB-powered similarity search
- **Document Chunking**: Intelligent document segmentation for better retrieval
- **Context Retrieval**: Automatically retrieves relevant document sections

### 🗂️ **File Management**
- **Multi-format Support**: Upload and process PDF, TXT, CSV, and Markdown files
- **Drag & Drop Interface**: Intuitive file upload with real-time feedback
- **File Organization**: Hierarchical file tree with expandable directories
- **File Search**: Quick file discovery and navigation


### 💻 **Desktop Application**
- **Electron-based**: Cross-platform desktop app (Windows, macOS, Linux)
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Updates**: Live file system monitoring and updates
- **Offline Capable**: Works with local files and models

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd second-brain
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Download AI Models** (Optional)
   - The app uses local LLM models (Llama, Mistral, Zephyr)
   - Models are automatically downloaded to `backend/models/` on first run
   - Supported formats: GGUF (quantized models)

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   python server.py
   ```
   The API server will start on `http://localhost:8002`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   This will start both the Vite dev server and Electron app

3. **Access the Application**
   - The Electron app will open automatically
   - Or access via browser at `http://localhost:5173`

## 📖 User Guide

### Getting Started

1. **Select Root Directory**
   - Click the folder icon in the sidebar
   - Choose your project directory
   - The app will scan and display your files

2. **Upload Documents**
   - Click the upload button (📤) in the sidebar
   - Select PDF, TXT, CSV, or MD files
   - Files are automatically processed and added to your knowledge base

3. **Start Chatting**
   - Click "New Chat" to start a conversation
   - Ask questions about your uploaded documents
   - Use `@filename` to reference specific files

### Chat Features

#### **File References**
Reference specific documents in your messages:
```
What does @document.pdf say about machine learning?
Summarize the key points from @notes.txt
```

#### **Built-in Commands**
Use slash commands for enhanced functionality:
- `/search <query>` - Search through your files
- `/summarize <file>` - Summarize a specific file
- `/help` - Show available commands
- `/clear` - Clear current conversation
- `/export <format>` - Export conversation

#### **Smart Responses**
The AI will:
- Use context from your uploaded documents
- Provide concise, helpful answers (under 100 words)
- Indicate when information isn't available in your knowledge base
- Maintain conversation context across messages

### File Management

#### **Supported File Types**
- **PDF**: Research papers, documents, reports
- **TXT**: Plain text files, notes, articles
- **CSV**: Data files, spreadsheets
- **MD**: Markdown files, documentation

#### **File Processing**
- Files are automatically chunked into smaller segments
- Each chunk is embedded and stored in the vector database
- Metadata is preserved for better retrieval
- Files are indexed for fast searching

#### **File Organization**
- Hierarchical file tree view
- Expandable directories
- File type icons and metadata
- Search and filter capabilities

## 🔧 Configuration

### Backend Configuration

Edit `backend/config.py` to customize:

```python
# Model Configuration
MODEL_PATH = "path/to/your/model.gguf"

# Server Configuration
HOST = "0.0.0.0"
PORT = 8002

# CORS Configuration
CORS_ORIGINS = ["http://localhost:5173"]

# Database Configuration
CHAT_HISTORY_DB_FILE = "data/chat_history.db"
CHROMA_DB_FILE = "data/chroma_db"
```

### Frontend Configuration

Edit `frontend/src/config/defaultPaths.ts` for default directories:

```typescript
export const DEFAULT_PATHS = {
  ROOT_DIRECTORY: "/path/to/default/directory",
  // Add other default paths
};
```

## 🏗️ Architecture

### Backend (Python)
- **FastAPI**: RESTful API server
- **LangChain**: LLM orchestration and document processing
- **ChromaDB**: Vector database for semantic search
- **SQLite**: Chat history and file metadata storage
- **Sentence Transformers**: Text embeddings

### Frontend (React + Electron)
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Electron**: Desktop application wrapper
- **Vite**: Fast build tool and dev server

### Data Flow
1. **File Upload** → Backend processes and chunks documents
2. **Embedding** → Text chunks are converted to vectors
3. **Storage** → Vectors stored in ChromaDB, metadata in SQLite
4. **Query** → User question triggers semantic search
5. **Retrieval** → Relevant chunks retrieved from vector DB
6. **Generation** → LLM generates response using retrieved context

## 🛠️ Development

### Backend Development

```bash
cd backend
python server.py
```

**API Endpoints:**
- `GET /health` - Health check
- `POST /chat/{chat_id}` - Chat with AI
- `GET /files` - List ingested files
- `POST /files/upload` - Upload new file
- `DELETE /files/{filename}` - Delete file
- `GET /chats` - List chat sessions
- `POST /chats` - Create new chat

### Frontend Development

```bash
cd frontend
npm run dev:vite    # Start Vite dev server
npm run dev:electron # Start Electron app
```

**Key Components:**
- `App.tsx` - Main application component
- `Sidebar.tsx` - File management and navigation
- `Interface.tsx` - Chat interface
- `MessageInput.tsx` - Message input with autocomplete
- `FileTree.tsx` - File system browser

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in dist/
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📁 Project Structure

```
second-brain/
├── backend/                 # Python backend
│   ├── core/               # Core functionality
│   │   ├── chain.py        # LLM chain and streaming
│   │   ├── embeddings.py   # Text embeddings
│   │   ├── knowledge_base.py # Database operations
│   │   └── vector_store.py # Vector database operations
│   ├── data/               # Database files
│   ├── files/              # Uploaded files
│   ├── models/             # AI models
│   ├── routes.py           # API routes
│   └── server.py           # FastAPI server
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Utility functions
│   ├── electron/           # Electron main process
│   └── package.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (3.11+ required)
- Install all dependencies: `pip install -r requirements.txt`
- Check if port 8002 is available

**Frontend won't start:**
- Check Node.js version (18+ required)
- Install dependencies: `npm install`
- Clear node_modules and reinstall if needed

**File upload fails:**
- Check file type (only PDF, TXT, CSV, MD supported)
- Check file size (max 10MB)
- Ensure backend server is running

**AI responses are slow:**
- Consider using a smaller model
- Check system resources (RAM, CPU)
- Optimize chunk size in vector_store.py

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue with detailed description
- Include system information and error logs

## 🔮 Roadmap

- [ ] **Multi-language Support**: Support for more file formats
- [ ] **Cloud Sync**: Sync knowledge base across devices
- [ ] **Advanced Search**: Filters, tags, and advanced query options
- [ ] **Plugin System**: Extensible architecture for custom features
- [ ] **Mobile App**: Companion mobile application
- [ ] **Team Collaboration**: Shared knowledge bases
- [ ] **API Integration**: Connect with external services

---

**Built with ❤️ using React, FastAPI, and LangChain**
