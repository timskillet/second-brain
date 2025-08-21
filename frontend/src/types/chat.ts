export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  user_id: string;
}

export interface ChatResponse {
  response: string;
  message_id: string;
  timestamp: string;
}

export interface ChatHistory {
  messages: Message[];
  total: number;
}

export interface ChatRequest {
  message: string;
  user_id?: string;
} 