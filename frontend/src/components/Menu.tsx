import React from "react";
import type { FileNode } from "../types";
import { Edit, Trash2, Copy, Scissors, Download } from "lucide-react";

interface MenuProps {
  x: number;
  y: number;
  item?: FileNode | null;
  onAction?: (action: string, item: FileNode) => void;
  onClose: () => void;
}

const Menu: React.FC<MenuProps> = ({ x, y, item, onAction, onClose }) => {
  const menuItems = [
    {
      label: "Rename",
      icon: Edit,
      action: "rename",
      shortcut: "F2",
    },
    {
      label: "Copy",
      icon: Copy,
      action: "copy",
      shortcut: "Ctrl+C",
    },
    {
      label: "Cut",
      icon: Scissors,
      action: "cut",
      shortcut: "Ctrl+X",
    },
    {
      label: "Delete",
      icon: Trash2,
      action: "delete",
      shortcut: "Del",
    },
  ];

  if (!item) return null;

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, item);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop to close menu when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Context menu positioned at click coordinates */}
      <div
        className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 min-w-48"
        style={{
          left: x,
          top: y,
        }}
      >
        {menuItems.map((menuItem) => (
          <div
            key={menuItem.action}
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={() => handleAction(menuItem.action)}
          >
            <menuItem.icon className="h-4 w-4 text-gray-400" />
            <span className="flex-1">{menuItem.label}</span>
            <span className="text-xs text-gray-500">{menuItem.shortcut}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default Menu;
