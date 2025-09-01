import React, { useState } from "react";
import { X, FileIcon, Folder } from "lucide-react";
import type { FileItem } from "../../types";

interface FileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, isDirectory: boolean) => void;
  directory: boolean;
  selectedPath?: string;
}

const FileModal: React.FC<FileModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  selectedPath,
  directory,
}) => {
  const [name, setName] = useState("");
  const [isDirectory, setIsDirectory] = useState(directory);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.includes("/") || name.includes("\\")) {
      setError("Name cannot contain path separators");
      return;
    }

    onCreate(name.trim(), isDirectory);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setIsDirectory(false);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-secondary rounded-lg p-6 w-96 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-semibold">
            Create New {isDirectory ? "Directory" : "File"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isDirectory === false}
                  onChange={() => setIsDirectory(false)}
                  className="text-blue-500"
                />
                <FileIcon size={16} className="text-gray-400" />
                <span className="text-gray-300">File</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isDirectory === true}
                  onChange={() => setIsDirectory(true)}
                  className="text-blue-500"
                />
                <Folder size={16} className="text-gray-400" />
                <span className="text-gray-300">Directory</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Enter ${isDirectory ? "directory" : "file"} name`}
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>

          {selectedPath && (
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Location
              </label>
              <p className="text-gray-400 text-sm bg-gray-700 px-3 py-2 rounded-md">
                {selectedPath}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileModal;
