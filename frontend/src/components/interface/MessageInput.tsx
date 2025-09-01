import { Paperclip, Send } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import type { FileIndex } from "../../types";

interface InputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  fileIndex: FileIndex[];
}

// TODO: Fix @ symbol autocomplete

const Input: React.FC<InputProps> = ({
  onSendMessage,
  isLoading,
  fileIndex,
}) => {
  const [files, setFiles] = useState<FileIndex[]>(fileIndex);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<FileIndex[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({
    bottom: 0,
    left: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    console.log(fileIndex);
  }, [files]);

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const pos = e.target.selectionStart;
    setMessage(text);
    setCursorPos(pos);

    // Find the @ symbol position
    const beforeCursor = text.slice(0, pos);
    const match = beforeCursor.match(/@([\w./-]*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      const filtered = fileIndex.filter((f) =>
        f.name.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const insertReference = (filename: string) => {
    const before = message.slice(0, cursorPos);
    const after = message.slice(cursorPos);

    // Replace "@partial" with "@filename"
    const newBefore = before.replace(/@[\w./-]*$/, `@${filename} `);

    const newText = newBefore + after;
    setMessage(newText);
    setShowDropdown(false);

    // Move cursor after inserted text
    requestAnimationFrame(() => {
      const pos = newBefore.length;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    });
  };

  return (
    <div className="flex justify-center items-center space-x-3 relative">
      <button
        type="button"
        className="p-2 text-white hover:text-white hover:bg-hover rounded-full transition-colors duration-200"
        title="Attach file"
      >
        <Paperclip size={24} />
      </button>
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
          className="text-gray-300 w-full px-4 py-3 rounded-lg outline-none transition-all duration-200 resize-none"
          rows={1}
          disabled={isLoading}
        />

        {showDropdown && suggestions.length > 0 && (
          <ul
            className="absolute z-50 text-gray-300 bg-primary rounded-md shadow-md w-64 max-h-40 overflow-y-auto z-10 border border-gray-600"
            style={{
              bottom: dropdownPosition.bottom,
              left: dropdownPosition.left,
            }}
          >
            {suggestions.map((fileIndex, i) => (
              <li
                key={i}
                className="px-2 py-1 m-1 rounded-md cursor-pointer hover:bg-secondary"
                onClick={() => insertReference(fileIndex.name)}
              >
                {fileIndex.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        className="p-2 text-white hover:text-white hover:bg-hover rounded-full transition-colors duration-200"
        title="Send message"
        onClick={handleSendMessage}
      >
        <Send />
      </button>
    </div>
  );
};

export default Input;
