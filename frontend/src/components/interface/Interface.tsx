import React, { useState } from "react";

function Interface() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<[]>([]);

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
    </div>
  );
}

export default Interface;
