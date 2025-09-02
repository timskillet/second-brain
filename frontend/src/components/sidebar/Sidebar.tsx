import {
  PanelRight,
  Plus,
  Search,
  Settings,
  Upload,
  RefreshCcw,
  Folder,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import FileTree from "./FileTree";
import FileModal from "./FileModal";
import SettingsModal from "./SettingsModal";
import ChatTab from "./ChatTab";
import type { FileNode } from "../../types";
import { fileSystemService } from "../../services/fileSystem";

import { useChat } from "../../contexts/ChatProvider";

interface SidebarProps {
  onChatSelect: (chatId: string) => void;
  fileData: FileNode[];
  rootDirectory: string | null;
  onRootDirectoryChange: (newDirectory: string) => void;
  selectedChatId: string | null;
}

const Sidebar = ({
  onChatSelect,
  fileData,
  rootDirectory,
  onRootDirectoryChange,
  selectedChatId,
}: SidebarProps) => {
  const [open, setOpen] = useState(true);
  const [fileHovering, setFileHovering] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"file" | "directory">("directory");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Get chats from ChatProvider
  const { state } = useChat();
  const chats = state.chats;
  console.log("Chats", chats);

  useEffect(() => {
    console.log(fileData);
  }, [fileData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleNewChat = () => {
    onChatSelect("");
    console.log("New Chat");
  };

  const handleUpload = async () => {
    fileInputRef.current?.click();
    console.log(uploadFile?.name);
  };

  const handleSettings = () => {
    setIsSettingsModalOpen(true);
    console.log("Settings");
  };

  const handleFileSelect = (node: FileNode) => {
    setSelectedFile(node);
  };

  const handleCreateFile = async (
    parentPath: string,
    name: string,
    isDirectory: boolean
  ) => {
    try {
      if (isDirectory) {
        // Create directory using file system service
        await fileSystemService.createDirectory(`${parentPath}/${name}`);
      } else {
        // Create empty file using file system service
        await fileSystemService.writeFile(`${parentPath}/${name}`, "");
      }

      // Refresh the file data from parent
      if (onRootDirectoryChange) {
        // This will trigger a refresh in the parent component
        onRootDirectoryChange(rootDirectory || "");
      }
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  };

  const openCreateModal = (type: "file" | "directory") => {
    if (type === "file") {
      console.log("Opening file creation modal");
    } else {
      console.log("Opening directory creation modal");
    }
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleModalCreate = (name: string, isDirectory: boolean) => {
    const parentPath = selectedFile?.item.is_directory
      ? selectedFile.item.path
      : selectedFile?.item.path?.split("/").slice(0, -1).join("/") || "/";
    handleCreateFile(parentPath, name, isDirectory);
  };

  const handleContextMenuAction = async (action: string, item: FileNode) => {
    try {
      switch (action) {
        case "delete":
          await fileSystemService.deleteFile(item.item.path);
          break;
        case "rename":
          // TODO: Implement rename functionality
          console.log(`Renaming ${item.item.name}`);
          break;
        case "copy":
          // TODO: Implement copy functionality
          console.log(`Copying ${item.item.name}`);
          break;
        case "cut":
          // TODO: Implement cut functionality
          console.log(`Cutting ${item.item.name}`);
          break;
        default:
          break;
      }

      // Refresh the file data after action
      if (onRootDirectoryChange) {
        onRootDirectoryChange(rootDirectory || "");
      }
    } catch (error) {
      console.error(`Failed to perform action ${action}:`, error);
    }
  };

  const handleRefresh = async () => {
    try {
      // Refresh the file data from parent
      if (onRootDirectoryChange) {
        onRootDirectoryChange(rootDirectory || "");
      }
    } catch (error) {
      console.error("Failed to refresh files:", error);
    }
  };

  return (
    <div className="flex">
      <div
        className={`${
          open ? "w-64" : "w-16"
        } bg-secondary h-screen flex flex-col flex-[1_1_33%] min-h-0 transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col flex-[1_1_33%] min-h-0 px-2">
          {/* Header with toggle button */}
          <div
            className={`flex items-center justify-between px-4 ${
              !open && "justify-center"
            }`}
          >
            <div
              className={`${
                !open && "hidden"
              } text-white font-semibold text-lg`}
            >
              Menu
            </div>

            <div
              onClick={() => setOpen(!open)}
              className="flex justify-center items-center p-3 rounded-lg cursor-pointer hover:bg-hover transition-colors duration-200 outline-none focus:outline-none focus:ring-0"
            >
              <PanelRight
                size={24}
                className={`${
                  open ? "rotate-180" : ""
                } text-gray-300 transition-transform duration-300`}
              />
            </div>
          </div>
          {/* Menu Items */}
          <div
            onClick={handleNewChat}
            className="flex items-center p-3 mb-1 gap-3 rounded-lg text-gray-300 cursor-pointer hover:bg-hover hover:text-white transition-all duration-200"
          >
            <Plus size={24} className="flex-shrink-0" />
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              New Chat
            </span>
          </div>
          <div className="flex items-center p-3 mb-1 gap-3 rounded-lg text-gray-300 cursor-pointer hover:bg-hover hover:text-white transition-all duration-200">
            <Search size={24} className="flex-shrink-0" />
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              Search
            </span>
          </div>
          <div
            onClick={handleUpload}
            className="flex items-center p-3 mb-1 gap-3 rounded-lg text-gray-300 cursor-pointer hover:bg-hover hover:text-white transition-all duration-200"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.txt,.csv,.md"
            />
            <Upload size={24} className="flex-shrink-0" />
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              Upload
            </span>
          </div>
          <div
            onClick={handleSettings}
            className="flex items-center p-3 gap-3 rounded-lg text-gray-300 cursor-pointer hover:bg-hover hover:text-white transition-all duration-200"
          >
            <Settings size={24} className="flex-shrink-0" />
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              Settings
            </span>
          </div>
        </div>

        {/* Chats */}
        <div
          className={`${
            !open && "hidden"
          } flex flex-col flex-[1_1_33%] min-h-0 mb-4`}
        >
          <div className="text-gray-300 font-semibold text-xl mb-2 px-4">
            Chats
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            {Array.isArray(chats) &&
              chats.map((chat, index) => (
                <ChatTab
                  key={index}
                  chatId={chat.id}
                  chatName={chat.title}
                  onChatSelect={onChatSelect}
                  isSelected={selectedChatId === chat.id}
                />
              ))}
          </div>
        </div>

        {/* Files */}
        <div
          onMouseEnter={() => setFileHovering(true)}
          onMouseLeave={() => setFileHovering(false)}
          className={`${
            !open && "hidden"
          } flex flex-col flex-[1_1_33%] min-h-0`}
        >
          {/* File Header and Actions */}
          <div className="flex justify-between items-center mb-2 px-4">
            <div className="flex text-gray-300 font-semibold text-xl">
              Files
            </div>
            <div
              className={`flex text-gray-300 gap-2 ${
                !fileHovering && "hidden"
              }`}
            >
              <Plus
                size={24}
                onClick={() => openCreateModal("file")}
                className="cursor-pointer hover:bg-hover rounded-lg p-1 flex-shrink-0"
              />
              <Folder
                size={24}
                onClick={() => openCreateModal("directory")}
                className="cursor-pointer hover:bg-hover rounded-lg p-1 flex-shrink-0"
              />
              <RefreshCcw
                size={24}
                onClick={handleRefresh}
                className="cursor-pointer hover:bg-hover rounded-lg p-1 flex-shrink-0"
              />
            </div>
          </div>

          {/* Scrollable File Tree */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
            <FileTree
              fileData={fileData}
              onFileSelect={handleFileSelect}
              onCreateFile={handleCreateFile}
              onAction={handleContextMenuAction}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>

      {/* File Creation Modal */}
      <FileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleModalCreate}
        selectedPath={
          selectedFile?.item.is_directory
            ? selectedFile.item.path
            : selectedFile?.item.path?.split("/").slice(0, -1).join("/") || "/"
        }
        directory={modalType === "directory"}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentRootDirectory={rootDirectory}
        onRootDirectoryChange={onRootDirectoryChange}
      />
    </div>
  );
};

export default Sidebar;
