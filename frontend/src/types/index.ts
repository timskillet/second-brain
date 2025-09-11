export interface FileItem {
    name: string;
    path: string;
    is_directory: boolean;
    last_modified?: string;
    size?: number;
}

export interface FileNode {
    item: FileItem;
    children: FileNode[];
    id: string;
    isExpanded: boolean;
  }

export interface FileIndex {
    id: string;
    name: string;
    path: string;
}

export interface IngestedFile {
    id: string;
    name: string;
    path: string;
}

// Personality interface
export interface Personality {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

// Enhanced Chat interface
export interface Chat {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    personality_id?: string;
}

// Chat response interface
export interface ChatResponse {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    personality_id?: string;
}

// Message interface
export interface Message {
    id: string;
    chat_id: string | null;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    user_id: string;
}

// New interfaces for API responses
export interface CreateChatRequest {
    title: string;
    personality_id?: string;
}

export interface CreateMessageRequest {
    role: 'user' | 'assistant';
    content: string;
}