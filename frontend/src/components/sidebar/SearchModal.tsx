import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  MessageSquare,
  FileText,
  Clock,
  Loader2,
  ArrowRight,
  Hash,
} from "lucide-react";
import chatService from "../../services/chatService";

interface SearchResult {
  chatId: string;
  chatTitle: string;
  matchType: "title" | "message" | "file";
  snippet: string;
  messageId?: string;
  timestamp: string;
  relevanceScore: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatSelect: (chatId: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onChatSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      5
    );
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // Search handler
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await chatService.searchChats(query);
      setSearchResults(results);
      saveRecentSearch(query);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debouncing
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          selectResult(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  // Select search result
  const selectResult = (result: SearchResult) => {
    onChatSelect(result.chatId);
    onClose();
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedIndex(0);
  };

  // Highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 text-yellow-900 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Get result icon
  const getResultIcon = (matchType: string) => {
    switch (matchType) {
      case "title":
        return <MessageSquare size={16} className="text-blue-500" />;
      case "file":
        return <FileText size={16} className="text-green-500" />;
      case "message":
        return <Hash size={16} className="text-purple-500" />;
      default:
        return <Search size={16} className="text-gray-500" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search size={20} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search chats and messages..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none text-lg"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto max-h-96">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Searching...</span>
            </div>
          ) : searchQuery ? (
            searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.chatId}-${result.messageId || index}`}
                    onClick={() => selectResult(result)}
                    className={`flex items-start gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                      index === selectedIndex
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getResultIcon(result.matchType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {highlightText(result.chatTitle, searchQuery)}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                          {result.matchType}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {highlightText(result.snippet, searchQuery)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {formatTimestamp(result.timestamp)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm">Try searching for something else</p>
              </div>
            )
          ) : (
            <div className="py-4">
              {recentSearches.length > 0 && (
                <div className="px-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Recent searches
                  </h3>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(search)}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Clock size={14} />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Search your chats</p>
                <p className="text-sm">
                  Find messages, files, and conversations
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                  Enter
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                  Esc
                </kbd>
                Close
              </span>
            </div>
            {searchResults.length > 0 && (
              <span>
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
