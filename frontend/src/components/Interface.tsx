import React, { useState } from "react";
import Input from "./Input";
import { chatService } from "../services/chatService";
import type { Message } from "../types/chat";

const Interface: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState<string>("");

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
        (token) => {
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to your Second Brain
          </h2>
          <p className="text-gray-600 mb-6">
            I'm an AI assistant ready to help you with questions, conversations,
            and more. Start by typing a message below!
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Chat History
        </h3>

        {/* Display messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 p-3 rounded-lg ${
              message.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
            }`}
          >
            <div className="font-medium text-sm text-gray-600 mb-1">
              {message.role === "user" ? "You" : "AI"}
            </div>
            <div className="text-gray-800 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden">
              {message.content}
            </div>
          </div>
        ))}

        {/* Show streaming response */}
        {isStreaming && streamedResponse && (
          <div className="mb-4 p-3 rounded-lg bg-gray-100 mr-8">
            <div className="font-medium text-sm text-gray-600 mb-1">AI</div>
            <div className="text-gray-800 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden">
              {streamedResponse}
              <span className="cursor">|</span>
            </div>
          </div>
        )}
      </div>

      <Input onSendMessage={handleStreamMessage} isLoading={isLoading} />
    </div>
  );
};

export default Interface;
