import React, { useState, useEffect } from "react";
import MessageInput from "./MessageInput";
import type { FileIndex, Message } from "../../types";
import chatService from "../../services/chatService";

interface InterfaceProps {
  fileIndex: FileIndex[];
}

const Interface: React.FC<InterfaceProps> = ({ fileIndex }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState<string>("");
  const [index, setIndex] = useState<FileIndex[]>(fileIndex);
  const handleStreamMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    setIsLoading(true);
    setIsStreaming(true);
    setStreamedResponse("");

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
      user_id: "user",
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const fullResponse = await chatService.streamMessage(
        messageText,
        "user",
        (token: string) => {
          setStreamedResponse((prev) => prev + token);
        }
      );

      // Add AI message with complete response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date().toISOString(),
        user_id: "assistant",
      };

      setMessages((prev) => [...prev, aiMessage]);
      setStreamedResponse(""); // Clear streaming display
    } catch (error) {
      console.error("Error streaming message:", error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
        user_id: "assistant",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Welcome message - only show when no messages */}
      {messages.length === 0 && (
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
        className={`flex-1 overflow-y-auto ${
          messages.length === 0 ? "hidden" : "block"
        }`}
      >
        <div className="p-6 space-y-4">
          {/* Display messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 ml-8"
                  : "bg-gray-100 mr-8"
              } bg-primary`}
            >
              <div className="font-medium text-sm text-gray-300 mb-1">
                {message.role === "user" ? "You" : "AI"}
              </div>
              <div className="text-gray-300 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden">
                {message.content}
              </div>
            </div>
          ))}

          {/* Show streaming response */}
          {isStreaming && streamedResponse && (
            <div className="p-3 rounded-lg bg-gray-100 mr-8">
              <div className="font-medium text-sm text-gray-600 mb-1">AI</div>
              <div className="text-gray-800 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden">
                {streamedResponse}
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
