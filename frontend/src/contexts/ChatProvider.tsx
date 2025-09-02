import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type { Chat, Message } from "../types";
import chatService from "../services/chatService";

// ChatContext.tsx
interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
  streamedResponse: string;
}

type ChatAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "SET_CURRENT_CHAT"; payload: Chat | null }
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: { chatId: string; message: Message } }
  | { type: "SET_STREAMING"; payload: boolean }
  | { type: "SET_STREAMED_RESPONSE"; payload: string }
  | { type: "CLEAR_STREAMED_RESPONSE" }
  | { type: "UPDATE_CHAT_TITLE"; payload: { chatId: string; title: string } }
  | { type: "REMOVE_CHAT"; payload: { chatId: string } };

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: {},
  isLoading: false,
  error: null,
  isStreaming: false,
  streamedResponse: "",
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_CHATS":
      return { ...state, chats: action.payload };
    case "SET_CURRENT_CHAT":
      return { ...state, currentChat: action.payload };
    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          [action.payload.chatId]: action.payload.messages,
        },
      };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: [
            ...state.messages[action.payload.chatId],
            action.payload.message,
          ],
        },
      };
    case "SET_STREAMING":
      return { ...state, isStreaming: action.payload };
    case "SET_STREAMED_RESPONSE":
      return { ...state, streamedResponse: action.payload };
    case "CLEAR_STREAMED_RESPONSE":
      return { ...state, streamedResponse: "" };
    case "UPDATE_CHAT_TITLE":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.chatId
            ? { ...chat, title: action.payload.title }
            : chat
        ),
        currentChat:
          state.currentChat?.id === action.payload.chatId
            ? { ...state.currentChat, title: action.payload.title }
            : state.currentChat,
      };
    case "REMOVE_CHAT":
      const { [action.payload.chatId]: _, ...restMessages } = state.messages;
      return {
        ...state,
        chats: state.chats.filter((chat) => chat.id !== action.payload.chatId),
        currentChat:
          state.currentChat?.id === action.payload.chatId
            ? null
            : state.currentChat,
        messages: restMessages,
      };
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  actions: {
    createChat: (title: string) => Promise<void>;
    selectChat: (chatId: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    updateChatTitle: (chatId: string, title: string) => Promise<void>;
    loadChats: () => Promise<void>;
  };
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      const chats = await chatService.getChats();
      dispatch({ type: "SET_CHATS", payload: chats });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to load chats",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const createChat = async (title: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      const newChat = await chatService.createChat(title);
      dispatch({ type: "SET_CHATS", payload: [newChat, ...state.chats] });
      dispatch({ type: "SET_CURRENT_CHAT", payload: newChat });
      dispatch({
        type: "SET_MESSAGES",
        payload: { chatId: newChat.id, messages: [] },
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to create chat",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const chatData = await chatService.getChat(chatId);
      const chat = state.chats.find((c) => c.id === chatId) || null;

      dispatch({ type: "SET_CURRENT_CHAT", payload: chat });
      dispatch({
        type: "SET_MESSAGES",
        payload: { chatId, messages: chatData },
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to load chat",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const sendMessage = async (content: string) => {
    if (!state.currentChat) {
      // Create new chat if none exists
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await createChat(title);
      if (!state.currentChat) return;
    }

    try {
      dispatch({ type: "SET_STREAMING", payload: true });
      dispatch({ type: "CLEAR_STREAMED_RESPONSE" });
      dispatch({ type: "SET_ERROR", payload: null });

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        chat_id: state.currentChat.id,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        user_id: "user",
      };
      dispatch({
        type: "ADD_MESSAGE",
        payload: { chatId: state.currentChat.id, message: userMessage },
      });

      // Stream AI response
      const fullResponse = await chatService.streamMessage(
        content,
        (token: string) => {
          dispatch({
            type: "SET_STREAMED_RESPONSE",
            payload: state.streamedResponse + token,
          });
        }
      );

      // Add AI message with complete response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        chat_id: state.currentChat.id,
        role: "assistant",
        content: fullResponse,
        timestamp: new Date().toISOString(),
        user_id: "assistant",
      };
      dispatch({
        type: "ADD_MESSAGE",
        payload: { chatId: state.currentChat.id, message: aiMessage },
      });
      dispatch({ type: "CLEAR_STREAMED_RESPONSE" });

      // Refresh chats to update last message preview
      await loadChats();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to send message",
      });
    } finally {
      dispatch({ type: "SET_STREAMING", payload: false });
    }
  };

  const deleteChat = async (chatId: string) => {
    //     try {
    //       dispatch({ type: 'SET_LOADING', payload: true });
    //       dispatch({ type: 'SET_ERROR', payload: null });
    //       await chatService.deleteChat(chatId);
    //       dispatch({ type: 'REMOVE_CHAT', payload: chatId });
    //     } catch (error) {
    //       dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete chat' });
    //     } finally {
    //       dispatch({ type: 'SET_LOADING', payload: false });
    //     }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    //       try {
    //         dispatch({ type: "SET_LOADING", payload: true });
    //         dispatch({ type: "SET_ERROR", payload: null });
    //         await chatService.updateChatTitle(chatId, title);
    //         dispatch({ type: "UPDATE_CHAT_TITLE", payload: { chatId, title } });
    //       } catch (error) {
    //         dispatch({
    //           type: "SET_ERROR",
    //           payload:
    //             error instanceof Error
    //               ? error.message
    //               : "Failed to update chat title",
    //         });
    //       } finally {
    //         dispatch({ type: "SET_LOADING", payload: false });
    //       }
  };

  const contextValue: ChatContextType = {
    state,
    actions: {
      createChat,
      selectChat,
      sendMessage,
      deleteChat,
      updateChatTitle,
      loadChats,
    },
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
