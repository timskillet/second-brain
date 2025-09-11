import React, { useState, useEffect } from "react";
import MessageInput from "./MessageInput";
import PersonalitySelector from "./PersonalitySelector";
import type { FileIndex, IngestedFile, Personality } from "../../types";
import { useChat } from "../../contexts/ChatProvider";

interface InterfaceProps {
  chatId: string | null;
  fileIndex: FileIndex[];
  ingestedFiles: IngestedFile[];
}

const Interface: React.FC<InterfaceProps> = ({
  chatId,
  fileIndex,
  ingestedFiles,
}) => {
  const { state, actions } = useChat();
  const [isLoading, setIsLoading] = useState(false);
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

  // Get current chat's personality
  const currentChat = state.chats.find((chat) => chat.id === currentChatId);
  const currentPersonality =
    state.personalities.find(
      (p) => p.id === (currentChat?.personality_id || "assistant")
    ) || state.personalities[0];

  const handleStreamMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    setIsLoading(true);

    try {
      // Create new chat if none exists
      let activeChatId = currentChatId;
      if (!activeChatId) {
        const title =
          messageText.slice(0, 50) + (messageText.length > 50 ? "..." : "");
        const personalityId = state.currentPersonality?.id || "assistant";
        const newChatId = await actions.createChat(title, personalityId);
        if (!newChatId) {
          throw new Error("Failed to create chat");
        }
        activeChatId = newChatId;
        setCurrentChatId(newChatId);
      }

      const personalityId =
        currentChat?.personality_id ||
        state.currentPersonality?.id ||
        "assistant";
      await actions.sendMessage(messageText, activeChatId, personalityId);
    } catch (error) {
      console.error("Error streaming message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalityChange = (personality: Personality) => {
    actions.setCurrentPersonality(personality);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header with personality selector */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary-text">Second Brain</h1>
          {currentPersonality && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{currentPersonality.icon}</span>
              <span>{currentPersonality.name}</span>
            </div>
          )}
        </div>
        <PersonalitySelector
          chatId={currentChatId || undefined}
          onPersonalityChange={handlePersonalityChange}
          className="z-40"
        />
      </div>

      {/* Welcome message - only show when no messages */}
      {currentMessages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-primary p-8 max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-300 mb-2">
              Welcome to your Second Brain
            </h2>
            <p className="text-gray-600 mb-6">
              I'm {currentPersonality?.name || "an AI assistant"} ready to help
              you with questions, conversations, and more. Start by typing a
              message below!
            </p>
            {currentPersonality && (
              <div className="text-sm text-gray-500">
                {currentPersonality.description}
              </div>
            )}
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
                {message.role === "user"
                  ? "You"
                  : currentPersonality?.name || "AI"}
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
                  {currentPersonality?.name || "AI"}
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
      <div className="bg-secondary rounded-full my-4 p-4">
        <MessageInput
          onSendMessage={handleStreamMessage}
          isLoading={isLoading}
          fileIndex={fileIndex}
          ingestedFiles={ingestedFiles}
        />
      </div>
    </div>
  );
};

export default Interface;
