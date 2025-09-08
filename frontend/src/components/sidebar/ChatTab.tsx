import { Ellipsis } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ChatContextMenu from "./ChatContextMenu";

interface ChatTabProps {
  chatId: string;
  chatName: string;
  isSelected: boolean;
  onChatSelect: (chatId: string) => void;
  onRenameChat?: (chatId: string, newName: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onDuplicateChat?: (chatId: string) => void;
}

function ChatTab({
  chatId,
  chatName,
  onChatSelect,
  isSelected,
  onRenameChat,
  onDeleteChat,
  onDuplicateChat,
}: ChatTabProps) {
  const [chatHovering, setChatHovering] = useState(false);
  const [ellipsisHovering, setEllipsisHovering] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chatName);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const ellipsisRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editValue when chatName changes
  useEffect(() => {
    setEditValue(chatName);
  }, [chatName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle click outside to close context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node) &&
        ellipsisRef.current &&
        !ellipsisRef.current.contains(event.target as Node)
      ) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showContextMenu]);

  const handleEllipsisClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = ellipsisRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({
        x: rect.left,
        y: rect.bottom + 5,
      });
    }
    setShowContextMenu(!showContextMenu);
  };

  const handleRenameClick = () => {
    setIsEditing(true);
    setShowContextMenu(false);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== chatName) {
      onRenameChat?.(chatId, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(chatName);
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div
      onMouseEnter={() => setChatHovering(true)}
      onMouseLeave={() => setChatHovering(false)}
      key={chatId}
      onClick={() => {
        console.log("ChatTab: Selecting chat:", chatId);
        onChatSelect(chatId);
      }}
    >
      <div className="cursor-pointer">
        <div
          className={`flex justify-between p-2 mb-1 items-center rounded-lg flex-1 ${
            ((chatHovering && !ellipsisHovering) || isSelected) && "bg-hover"
          }`}
        >
          {isEditing ? (
            <span className="flex-1 text-xl text-gray-300 truncate">
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="flex-1 text-xl text-gray-300 bg-transparent border border-gray-500 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500"
                placeholder=""
              />
            </span>
          ) : (
            <span className="flex-1 text-xl text-gray-300 truncate">
              {chatName}
            </span>
          )}
          <div ref={ellipsisRef} className="relative">
            <Ellipsis
              onMouseEnter={() => setEllipsisHovering(true)}
              onMouseLeave={() => setEllipsisHovering(false)}
              onClick={handleEllipsisClick}
              className={`text-gray-300 ${!chatHovering && "hidden"} ${
                ellipsisHovering && "rounded-lg bg-hover"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <ChatContextMenu
          contextMenuRef={contextMenuRef as React.RefObject<HTMLDivElement>}
          menuPosition={menuPosition}
          chatId={chatId}
          onRenameChat={handleRenameClick}
          onDuplicateChat={onDuplicateChat as (chatId: string) => void}
          onDeleteChat={onDeleteChat as (chatId: string) => void}
        />
      )}
    </div>
  );
}

export default ChatTab;
