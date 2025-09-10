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
      const target = event.target as Element;
      const isClickOnTextarea = textareaRef.current?.contains(target);
      const isClickOnDropdown = target.closest("[data-dropdown]");

      if (!isClickOnTextarea && !isClickOnDropdown) {
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

    // Handle Arrow keys and Tab for dropdown navigation
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

    if (showDropdown && (e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
      e.preventDefault();
      handleSelection(selectedIndex);
      return;
    }

    // Handle Enter key for sending message
    if (e.key === "Enter" && !e.shiftKey) {
      if (!showDropdown) {
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

  const handleSelection = (index: number) => {
    console.log("handleSelection called with index:", index);
    console.log("dropdownType:", dropdownType);
    console.log("suggestions:", suggestions);
    console.log("commandSuggestions:", commandSuggestions);

    const currentSuggestions =
      dropdownType === "files" ? suggestions : commandSuggestions;

    if (currentSuggestions[index]) {
      console.log("Selection found, calling insert function");
      if (dropdownType === "files") {
        insertReference(suggestions[index].name);
      } else {
        insertCommand(commandSuggestions[index]);
      }
    } else {
      console.log("No selection found at index:", index);
    }
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
          <div
            data-dropdown
            className={`absolute z-50 text-gray-300 rounded-md shadow-md w-80 max-h-40 overflow-y-auto border border-gray-600 bg-gray-800`}
            style={{
              bottom: dropdownPosition.bottom,
              left: dropdownPosition.left,
            }}
          >
            <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-600 bg-gray-700 rounded-t-md">
              {dropdownType === "files" ? "Files" : "Commands"} - Use ↑↓ or Tab
              to navigate, Enter to select, Esc to close
            </div>
            <ul>
              {dropdownType === "files" ? (
                suggestions.length > 0 ? (
                  suggestions.map((fileIndex, i) => (
                    <li
                      key={i}
                      className={`px-3 py-2 m-1 rounded-md cursor-pointer flex items-center transition-colors duration-150 ${
                        i === selectedIndex
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(
                          "CLICKED on file:",
                          fileIndex.name,
                          "index:",
                          i
                        );
                        handleSelection(i);
                      }}
                    >
                      <span className="text-sm font-medium">
                        {fileIndex.name}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        @{fileIndex.name}
                      </span>
                      {i === selectedIndex && (
                        <span className="ml-auto text-xs text-blue-300">←</span>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 m-1 text-gray-500">
                    No files found
                  </li>
                )
              ) : dropdownType === "commands" ? (
                commandSuggestions.length > 0 ? (
                  commandSuggestions.map((command, i) => (
                    <li
                      key={i}
                      className={`px-3 py-2 m-1 rounded-md cursor-pointer transition-colors duration-150 ${
                        i === selectedIndex
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(
                          "CLICKED on command:",
                          command.name,
                          "index:",
                          i
                        );
                        handleSelection(i);
                      }}
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
                      {i === selectedIndex && (
                        <span className="ml-auto text-xs text-blue-300">←</span>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 m-1 text-gray-500">
                    No commands found
                  </li>
                )
              ) : null}
            </ul>
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
