import {
  PanelRight,
  Plus,
  Search,
  Settings,
  Upload,
  RefreshCcw,
  Folder,
  Loader2,
} from "lucide-react";
import React, { useRef, useState } from "react";
import FileTree from "./FileTree";
import FileModal from "./FileModal";
import SettingsModal from "./SettingsModal";
import ChatTab from "./ChatTab";
import type { FileNode, IngestedFile } from "../../types";
import {
  fileSystemService,
  ingestedFileSystemService,
} from "../../services/fileSystem";

import { useChat } from "../../contexts/ChatProvider";

interface SidebarProps {
  onChatSelect: (chatId: string) => void;
  fileData: FileNode[];
  ingestedFiles: IngestedFile[];
  rootDirectory: string | null;
  onRootDirectoryChange: (newDirectory: string) => void;
  selectedChatId: string | null;
}

const Sidebar = ({
  onChatSelect,
  fileData,
  ingestedFiles,
  rootDirectory,
  onRootDirectoryChange,
  selectedChatId,
}: SidebarProps) => {
  const [open, setOpen] = useState(true);
  const [fileHovering, setFileHovering] = useState(false);
  const [, setUploadFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"file" | "directory">("directory");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Get chats and actions from ChatProvider
  const { state, actions } = useChat();
  const chats = state.chats;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      await processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadStatus({ type: null, message: "" });

      // Validate file type
      const allowedTypes = [".pdf", ".txt", ".csv", ".md"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        throw new Error(
          `File type ${fileExtension} not allowed. Allowed types: ${allowedTypes.join(
            ", "
          )}`
        );
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File size too large. Maximum size is 50MB.");
      }

      // Upload file to backend
      await ingestedFileSystemService.uploadFile(file);

      setUploadStatus({
        type: "success",
        message: `File "${file.name}" uploaded and added to knowledge base successfully!`,
      });

      // Refresh ingested files list
      if (onRootDirectoryChange) {
        onRootDirectoryChange(rootDirectory || "");
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setIsUploading(false);

      // Clear status message after 5 seconds
      setTimeout(() => {
        setUploadStatus({ type: null, message: "" });
      }, 5000);
    }
  };

  const handleNewChat = () => {
    onChatSelect("");
    console.log("New Chat");
  };

  const handleUpload = async () => {
    fileInputRef.current?.click();
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

  {
    /* Update Chat Title */
  }
  const handleUpdateChatTitle = async (chatId: string, newTitle: string) => {
    await actions.updateChatTitle(chatId, newTitle);
  };

  {
    /* Delete Chat */
  }
  const handleDeleteChat = async (chatId: string) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      await actions.deleteChat(chatId);
      // If the deleted chat was selected, clear selection
      if (selectedChatId === chatId) {
        onChatSelect("");
      }
    }
  };

  const handleDuplicateChat = async (chatId: string) => {
    const newChatId = await actions.duplicateChat(chatId);
    if (newChatId) {
      // Select the new duplicated chat
      onChatSelect(newChatId);
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
            onClick={isUploading ? undefined : handleUpload}
            className={`flex items-center p-3 mb-1 gap-3 rounded-lg transition-all duration-200 ${
              isUploading
                ? "text-gray-500 cursor-not-allowed opacity-50"
                : "text-gray-300 cursor-pointer hover:bg-hover hover:text-white"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.txt,.csv,.md"
            />
            {isUploading ? (
              <Loader2 size={24} className="flex-shrink-0 animate-spin" />
            ) : (
              <Upload size={24} className="flex-shrink-0" />
            )}
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </span>
          </div>

          {/* Upload Status Feedback */}
          {uploadStatus.type && (
            <div
              className={`mx-3 mb-2 p-2 rounded-lg text-sm ${
                uploadStatus.type === "success"
                  ? "bg-green-900/20 text-green-400 border border-green-800"
                  : "bg-red-900/20 text-red-400 border border-red-800"
              }`}
            >
              {uploadStatus.message}
            </div>
          )}
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
                  onRenameChat={handleUpdateChatTitle}
                  onDeleteChat={handleDeleteChat}
                  onDuplicateChat={handleDuplicateChat}
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
              ingestedFiles={ingestedFiles}
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
