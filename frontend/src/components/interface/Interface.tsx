import React, { useState, useEffect } from "react";
import MessageInput from "./MessageInput";
import type { FileIndex } from "../../types";
import { useChat } from "../../contexts/ChatProvider";

interface InterfaceProps {
  chatId: string | null;
  fileIndex: FileIndex[];
}

const Interface: React.FC<InterfaceProps> = ({ chatId, fileIndex }) => {
  const { state, actions } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const [index] = useState<FileIndex[]>(fileIndex);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);

  // Update currentChatId when prop changes and load chat messages
  useEffect(() => {
    setCurrentChatId(chatId);
    if (chatId) {
      actions.selectChat(chatId);
    }
  }, [chatId]);

  // Get messages and streaming state - this will automatically update when either
  // currentChatId changes OR when ChatProvider state changes
  const currentMessages = currentChatId
    ? state.messages[currentChatId] || []
    : [];
  const currentChatStreams = currentChatId
    ? state.chatStreams[currentChatId]
    : null;

  const handleStreamMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    setIsLoading(true);

    try {
      // Create new chat if none exists
      let activeChatId = currentChatId;
      if (!activeChatId) {
        const title =
          messageText.slice(0, 50) + (messageText.length > 50 ? "..." : "");
        const newChatId = await actions.createChat(title);
        if (!newChatId) {
          throw new Error("Failed to create chat");
        }
        activeChatId = newChatId;
        setCurrentChatId(newChatId);
      }
      await actions.sendMessage(messageText, activeChatId);
    } catch (error) {
      console.error("Error streaming message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Welcome message - only show when no messages */}
      {currentMessages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-primary p-8 max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-300 mb-2">
              Welcome to your Second Brain
            </h2>
            <p className="text-gray-600 mb-6">
              I'm an AI assistant ready to help you with questions,
              conversations, and more. Start by typing a message below!
            </p>
          </div>
        </div>
      )}

      {/* Chat history - takes up remaining space and scrolls */}
      <div
        className={`flex-1 overflow-y-auto custom-scrollbar ${
          currentMessages.length === 0 ? "hidden" : "block"
        }`}
      >
        <div className="p-6 space-y-4">
          {/* Display messages */}
          {currentMessages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-hover ml-8 rounded-lg border border-gray-600"
                  : "mr-8"
              }`}
            >
              <div className="font-medium text-sm text-primary-text mb-1">
                {message.role === "user" ? "You" : "AI"}
              </div>
              <div className="text-primary-text font-mono text-sm whitespace-pre-wrap break-words overflow-hidden">
                {message.content}
              </div>
            </div>
          ))}

          {/* Show streaming response */}
          {currentChatStreams?.isStreaming &&
            currentChatStreams.streamedResponse && (
              <div className="p-3 rounded-lg bg-hover mr-8">
                <div className="font-medium text-sm text-primary-text mb-1">
                  AI
                </div>
                <div className="text-primary-text font-mono text-sm whitespace-pre-wrap break-words overflow-hidden">
                  {currentChatStreams.streamedResponse}
                  <span className="cursor">|</span>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Message input - fixed at bottom */}
      <div className="bg-secondary rounded-full mb-4 p-4">
        <MessageInput
          onSendMessage={handleStreamMessage}
          isLoading={isLoading}
          fileIndex={index}
        />
      </div>
    </div>
  );
};

export default Interface;
