import React from "react";
import { Edit, Trash2, Copy } from "lucide-react";

interface ChatContextMenuProps {
  contextMenuRef: React.RefObject<HTMLDivElement>;
  menuPosition: { x: number; y: number };
  chatId: string;
  onRenameChat: () => void;
  onDuplicateChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}
function ChatContextMenu({
  contextMenuRef,
  menuPosition,
  chatId,
  onRenameChat,
  onDuplicateChat,
  onDeleteChat,
}: ChatContextMenuProps) {
  return (
    <div
      ref={contextMenuRef}
      className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
      }}
    >
      <button
        onClick={onRenameChat}
        className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
      >
        <Edit size={16} />
        Rename
      </button>

      <button
        onClick={() => onDuplicateChat?.(chatId)}
        className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
        disabled={!onDuplicateChat}
      >
        <Copy size={16} />
        Duplicate
      </button>

      <div className="border-t border-gray-600 my-1"></div>

      <button
        onClick={() => onDeleteChat?.(chatId)}
        className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2"
        disabled={!onDeleteChat}
      >
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  );
}

export default ChatContextMenu;
