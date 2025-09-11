import React, { useState } from "react";
import type { Personality } from "../../types";
import { useChat } from "../../contexts/ChatProvider";

interface PersonalitySelectorProps {
  chatId?: string;
  onPersonalityChange?: (personality: Personality) => void;
  className?: string;
}

const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  chatId,
  onPersonalityChange,
  className = "",
}) => {
  const { state, actions } = useChat();
  const [isOpen, setIsOpen] = useState(false);

  const handlePersonalitySelect = async (personality: Personality) => {
    actions.setCurrentPersonality(personality);

    if (chatId) {
      await actions.updateChatPersonality(chatId, personality.id);
    }

    if (onPersonalityChange) {
      onPersonalityChange(personality);
    }

    setIsOpen(false);
  };

  const currentPersonality = state.currentPersonality || state.personalities[0];

  if (state.personalities.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-hover hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
      >
        <span className="text-lg">{currentPersonality?.icon}</span>
        <span className="text-sm font-medium text-primary-text">
          {currentPersonality?.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-secondary border border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">
              AI Personalities
            </div>
            {state.personalities.map((personality) => (
              <button
                key={personality.id}
                onClick={() => handlePersonalitySelect(personality)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPersonality?.id === personality.id
                    ? "bg-primary text-white"
                    : "hover:bg-hover text-primary-text"
                }`}
              >
                <span className="text-lg">{personality.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{personality.name}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {personality.description}
                  </div>
                </div>
                {currentPersonality?.id === personality.id && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalitySelector;
