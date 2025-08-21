import React, { useState } from "react";
import type { KeyboardEvent } from "react";
import { Send, Paperclip, Smile } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-end space-x-3">
        {/* Attachment and Emoji buttons */}
        <div className="flex space-x-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
            rows={1}
            style={{ minHeight: "48px", maxHeight: "120px" }}
            disabled={isLoading}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || isLoading}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Character count and tips */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Press Enter to send</span>
          <span>Shift+Enter for new line</span>
        </div>
        <div className="flex items-center space-x-2">
          {message.length > 0 && (
            <span className={message.length > 1000 ? "text-red-500" : ""}>
              {message.length} characters
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
