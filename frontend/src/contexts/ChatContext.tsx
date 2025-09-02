import type { Chat, Message } from "../types";

// ChatContext.tsx
interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

interface ChatContextType {
  state: ChatState;
  actions: {
    createChat: (title: string) => Promise<void>;
    selectChat: (chatId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    updateChatTitle: (chatId: string, title: string) => Promise<void>;
  };
}
