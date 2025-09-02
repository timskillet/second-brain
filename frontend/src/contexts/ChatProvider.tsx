import { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type { Chat, Message } from "../types";
import chatService from "../services/chatService";

// ChatContext.tsx
interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
  chatStreams: Record<
    string,
    {
      isStreaming: boolean;
      streamedResponse: string;
    }
  >;
}

type ChatAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: { chatId: string; message: Message } }
  | { type: "SET_STREAMING"; payload: { chatId: string; isStreaming: boolean } }
  | {
      type: "SET_STREAMED_RESPONSE";
      payload: { chatId: string; streamedResponse: string };
    }
  | { type: "CLEAR_STREAMED_RESPONSE"; payload: { chatId: string } }
  | { type: "UPDATE_CHAT_TITLE"; payload: { chatId: string; title: string } }
  | { type: "REMOVE_CHAT"; payload: { chatId: string } };

const initialState: ChatState = {
  chats: [],
  messages: {},
  isLoading: false,
  error: null,
  chatStreams: {},
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_CHATS":
      return { ...state, chats: action.payload };
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
            ...(state.messages[action.payload.chatId] || []),
            action.payload.message,
          ],
        },
      };
    case "SET_STREAMING":
      return {
        ...state,
        chatStreams: {
          ...state.chatStreams,
          [action.payload.chatId]: {
            ...state.chatStreams[action.payload.chatId],
            isStreaming: action.payload.isStreaming,
          },
        },
      };
    case "SET_STREAMED_RESPONSE":
      return {
        ...state,
        chatStreams: {
          ...state.chatStreams,
          [action.payload.chatId]: {
            ...state.chatStreams[action.payload.chatId],
            streamedResponse: action.payload.streamedResponse,
          },
        },
      };
    case "CLEAR_STREAMED_RESPONSE":
      return {
        ...state,
        chatStreams: {
          ...state.chatStreams,
          [action.payload.chatId]: {
            ...state.chatStreams[action.payload.chatId],
            streamedResponse: "",
          },
        },
      };
    case "UPDATE_CHAT_TITLE":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.chatId
            ? { ...chat, title: action.payload.title }
            : chat
        ),
      };
    case "REMOVE_CHAT":
      const { [action.payload.chatId]: _, ...restMessages } = state.messages;
      return {
        ...state,
        chats: state.chats.filter((chat) => chat.id !== action.payload.chatId),
        messages: restMessages,
      };
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  actions: {
    createChat: (title: string) => Promise<string | null>;
    selectChat: (chatId: string) => Promise<void>;
    sendMessage: (content: string, chatId: string) => Promise<void>;
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

  const createChat = async (title: string): Promise<string | null> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      const newChat = await chatService.createChat(title);

      const currentChats = Array.isArray(state.chats) ? state.chats : [];

      dispatch({ type: "SET_CHATS", payload: [newChat, ...currentChats] });
      dispatch({
        type: "SET_MESSAGES",
        payload: { chatId: newChat.id, messages: [] },
      });
      return newChat.id;
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to create chat",
      });
      return null;
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

  const sendMessage = async (
    content: string,
    chatId: string
  ): Promise<void> => {
    try {
      dispatch({
        type: "SET_STREAMING",
        payload: { chatId: chatId, isStreaming: true },
      });
      dispatch({
        type: "CLEAR_STREAMED_RESPONSE",
        payload: { chatId: chatId },
      });
      dispatch({ type: "SET_ERROR", payload: null });

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        chat_id: chatId,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        user_id: "user",
      };
      dispatch({
        type: "ADD_MESSAGE",
        payload: { chatId: chatId, message: userMessage },
      });

      // Stream AI response
      let accumulatedResponse = "";
      const fullResponse = await chatService.streamMessage(
        chatId,
        content,
        (token: string) => {
          accumulatedResponse += token;
          dispatch({
            type: "SET_STREAMED_RESPONSE",
            payload: {
              chatId: chatId,
              streamedResponse: accumulatedResponse,
            },
          });
        }
      );

      // Add AI message with complete response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        chat_id: chatId,
        role: "assistant",
        content: fullResponse,
        timestamp: new Date().toISOString(),
        user_id: "assistant",
      };
      dispatch({
        type: "ADD_MESSAGE",
        payload: { chatId: chatId, message: aiMessage },
      });
      dispatch({
        type: "CLEAR_STREAMED_RESPONSE",
        payload: { chatId: chatId },
      });

      // Refresh chats to update last message preview
      await loadChats();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to send message",
      });
    } finally {
      dispatch({
        type: "SET_STREAMING",
        payload: { chatId: chatId, isStreaming: false },
      });
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
