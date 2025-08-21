import axios from 'axios';
import type { ChatRequest, ChatResponse, ChatHistory } from '../types/chat';


const api = axios.create({
  baseURL: "http://localhost:8002",
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatService = {
  async streamMessage(
    message: string, 
    userId: string = 'user',
    onToken?: (token: string) => void
  ): Promise<string> {
    try {
      const response = await fetch("http://localhost:8002/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let result = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          
          // Handle special markers
          if (chunk.includes('[END]')) {
            // Remove the end marker and break
            const cleanChunk = chunk.replace('[END]', '');
            if (cleanChunk && onToken) {
              onToken(cleanChunk);
            }
            result += cleanChunk;
            break;
          }
          
          if (chunk.includes('[ERROR]')) {
            // Handle error marker
            const errorMsg = chunk.replace('[ERROR]', '');
            throw new Error(errorMsg || 'Streaming error occurred');
          }
          
          result += chunk;
          
          // Call the callback for each token to create typewriter effect
          if (onToken) {
            onToken(chunk);
          }
        }
      } finally {
        reader.releaseLock();
      }

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  },

  async getChatHistory(limit: number = 50): Promise<ChatHistory> {
    try {
      const response = await api.get<ChatHistory>(`/chat/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  },

  async clearChatHistory(): Promise<void> {
    try {
      await api.post('/chat/clear');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error('Failed to clear chat history');
    }
  },

  async checkHealth(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },
};

export default chatService; 