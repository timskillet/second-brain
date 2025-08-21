import { Paperclip, Send } from "lucide-react";
import React, { useState } from "react";

interface InputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const Input: React.FC<InputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState("");

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
      setMessage("");
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-end space-x-3">
        <button
          type="button"
          className="p-2 text-white hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Attach file"
        >
          <Paperclip />
        </button>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
          className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="button"
          className="p-2 text-white hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Send message"
          onClick={handleSendMessage}
        >
          <Send />
        </button>
      </div>
    </div>
  );
};

export default Input;
