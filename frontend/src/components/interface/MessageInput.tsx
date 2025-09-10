import { Paperclip, Send, SquarePause } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import type { FileIndex, IngestedFile } from "../../types";

interface InputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  fileIndex: FileIndex[];
  ingestedFiles: IngestedFile[];
}

interface Command {
  name: string;
  description: string;
  usage: string;
}

// TODO: Fix @ symbol autocomplete

const Input: React.FC<InputProps> = ({
  onSendMessage,
  isLoading,
  fileIndex,
  ingestedFiles,
}) => {
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<FileIndex[]>([]);
  const [commandSuggestions, setCommandSuggestions] = useState<Command[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownType, setDropdownType] = useState<"files" | "commands" | null>(
    null
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({
    bottom: 0,
    left: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Available commands
  const availableCommands: Command[] = [
    {
      name: "search",
      description: "Search through your files",
      usage: "/search <query>",
    },
    {
      name: "summarize",
      description: "Summarize a file or conversation",
      usage: "/summarize <file>",
    },
    {
      name: "help",
      description: "Show available commands",
      usage: "/help",
    },
    {
      name: "clear",
      description: "Clear the current conversation",
      usage: "/clear",
    },
    {
      name: "export",
      description: "Export conversation to file",
      usage: "/export <format>",
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

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

    const beforeCursor = text.slice(0, pos);

    // Check for @ symbol (file references) - must be at start or have space before @
    const fileMatch = beforeCursor.match(/(?:^|\s)@([\w./-]*)$/);
    // Check for / symbol (commands) - must be at start of message
    const commandMatch = beforeCursor.match(/^\/([\w-]*)$/);

    if (fileMatch) {
      // Handle file references
      const query = fileMatch[1].toLowerCase();
      const filtered = ingestedFiles.filter((f) =>
        f.name.toLowerCase().includes(query)
      );
      console.log("Filtered file suggestions:", filtered);
      setSuggestions(filtered);
      setCommandSuggestions([]);
      setDropdownType("files");
      setSelectedIndex(0);
      setShowDropdown(true);

      // Update dropdown position
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setDropdownPosition({
          bottom: rect.height + 5,
          left: 0,
        });
      }
    } else if (commandMatch) {
      // Handle commands
      const query = commandMatch[1].toLowerCase();
      const filtered = availableCommands.filter((cmd) =>
        cmd.name.toLowerCase().includes(query)
      );
      console.log("Filtered command suggestions:", filtered);
      setCommandSuggestions(filtered);
      setSuggestions([]);
      setDropdownType("commands");
      setSelectedIndex(0);
      setShowDropdown(true);

      // Update dropdown position
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setDropdownPosition({
          bottom: rect.height + 5,
          left: 0,
        });
      }
    } else {
      console.log("No match, hiding dropdown");
      setShowDropdown(false);
      setDropdownType(null);
      setSelectedIndex(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Escape key to close dropdown
    if (e.key === "Escape") {
      setShowDropdown(false);
      setDropdownType(null);
      setSelectedIndex(0);
      return;
    }

    // Handle Arrow keys for dropdown navigation
    if (showDropdown && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const currentSuggestions =
        dropdownType === "files" ? suggestions : commandSuggestions;
      const maxIndex = currentSuggestions.length - 1;

      if (e.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
      }
      return;
    }

    // Handle Enter key for selecting from dropdown or sending message
    if (e.key === "Enter" && !e.shiftKey) {
      if (showDropdown) {
        e.preventDefault();
        const currentSuggestions =
          dropdownType === "files" ? suggestions : commandSuggestions;
        if (currentSuggestions[selectedIndex]) {
          if (dropdownType === "files") {
            insertReference(suggestions[selectedIndex].name);
          } else {
            insertCommand(commandSuggestions[selectedIndex]);
          }
        }
        return;
      } else {
        e.preventDefault();
        handleSendMessage();
        setMessage("");
        return;
      }
    }
  };

  const insertReference = (filename: string) => {
    const before = message.slice(0, cursorPos);
    const after = message.slice(cursorPos);

    // Replace "@partial" or " @partial" with "@filename" or " @filename"
    const newBefore = before.replace(/(?:^|\s)@[\w./-]*$/, (match) => {
      // If match starts with space, keep the space; otherwise it's at start of message
      return match.startsWith(" ") ? ` @${filename}` : `@${filename}`;
    });

    const newText = newBefore + after;
    setMessage(newText);
    setShowDropdown(false);
    setDropdownType(null);

    // Move cursor after inserted text
    requestAnimationFrame(() => {
      const pos = newBefore.length;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    });
  };

  const insertCommand = (command: Command) => {
    const before = message.slice(0, cursorPos);
    const after = message.slice(cursorPos);

    // Replace "/partial" with "/command "
    const newBefore = before.replace(/^\/[\w-]*$/, `/${command.name} `);

    const newText = newBefore + after;
    setMessage(newText);
    setShowDropdown(false);
    setDropdownType(null);

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
          onKeyDown={handleKeyDown}
          placeholder="Type your message here... (Start with / for commands, use @ for file references)"
          className="text-gray-300 w-full px-4 py-3 rounded-lg outline-none transition-all duration-200 resize-none"
          rows={1}
          disabled={isLoading}
        />

        {showDropdown && (
          <ul
            className={`absolute z-50 text-gray-300 rounded-md shadow-md w-80 max-h-40 overflow-y-auto border border-gray-600 ${
              dropdownType === "files" ? "bg-primary" : "bg-primary"
            }`}
            style={{
              bottom: dropdownPosition.bottom,
              left: dropdownPosition.left,
            }}
          >
            {dropdownType === "files" ? (
              suggestions.length > 0 ? (
                suggestions.map((fileIndex, i) => (
                  <li
                    key={i}
                    className={`px-3 py-2 m-1 rounded-md cursor-pointer flex items-center ${
                      i === selectedIndex ? "bg-primary" : "hover:bg-secondary"
                    }`}
                    onClick={() => insertReference(fileIndex.name)}
                  >
                    <span className="text-sm font-medium">
                      {fileIndex.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      @{fileIndex.name}
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 m-1 text-gray-500">No files found</li>
              )
            ) : dropdownType === "commands" ? (
              commandSuggestions.length > 0 ? (
                commandSuggestions.map((command, i) => (
                  <li
                    key={i}
                    className={`px-3 py-2 m-1 rounded-md cursor-pointer ${
                      i === selectedIndex ? "bg-primary" : "hover:bg-secondary"
                    }`}
                    onClick={() => insertCommand(command)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-white">
                          /{command.name}
                        </span>
                        <span className="text-xs text-gray-300 ml-2">
                          {command.usage}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 mt-1">
                        {command.description}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 m-1 text-gray-500">
                  No commands found
                </li>
              )
            ) : null}
          </ul>
        )}
        {/* Debug info */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute top-0 right-0 text-xs text-gray-500 bg-black p-1 rounded">
            <div>showDropdown: {showDropdown.toString()}</div>
            <div>type: {dropdownType}</div>
            <div>
              files: {suggestions.length}, commands: {commandSuggestions.length}
            </div>
            <div>selected: {selectedIndex}</div>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => {
                  setSuggestions(fileIndex.slice(0, 3));
                  setCommandSuggestions([]);
                  setDropdownType("files");
                  setShowDropdown(true);
                }}
                className="px-1 bg-primary text-white rounded"
              >
                Test Files
              </button>
              <button
                onClick={() => {
                  setCommandSuggestions(availableCommands.slice(0, 3));
                  setSuggestions([]);
                  setDropdownType("commands");
                  setShowDropdown(true);
                }}
                className="px-1 bg-primary text-white rounded"
              >
                Test Commands
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        className="p-2 text-white hover:text-white hover:bg-hover rounded-full transition-colors duration-200"
        title="Send message"
        onClick={handleSendMessage}
      >
        {isLoading ? <SquarePause /> : <Send />}
      </button>
    </div>
  );
};

export default Input;
