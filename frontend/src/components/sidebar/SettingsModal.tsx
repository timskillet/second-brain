import React, { useState, useEffect } from "react";
import { X, Folder, Settings, RefreshCw } from "lucide-react";
import { fileSystemService } from "../../services/fileSystem";
import { truncatePath } from "../../utils";
import { DEFAULT_PATHS } from "../../config/defaultPaths";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRootDirectory: string | null;
  onRootDirectoryChange: (directory: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentRootDirectory,
  onRootDirectoryChange,
}) => {
  const [projectDirectory, setProjectDirectory] = useState<string>("");
  const [isDirectorySelected, setIsDirectorySelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    if (currentRootDirectory) {
      setProjectDirectory(currentRootDirectory);
      setIsDirectorySelected(true);
    } else {
      setProjectDirectory("");
      setIsDirectorySelected(false);
    }
  }, [currentRootDirectory]);

  const handleSelectProjectDirectory = async () => {
    setIsLoading(true);
    try {
      const selectedDir = await fileSystemService.showDirectoryPicker();
      if (selectedDir) {
        const success = fileSystemService.setRootDirectory(selectedDir);
        if (success) {
          setProjectDirectory(selectedDir);
          setIsDirectorySelected(true);
        }
      }
    } catch (error) {
      console.error("Failed to select project directory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = () => {
    // Reset to the default from configuration
    const defaultDir = DEFAULT_PATHS.ROOT_DIRECTORY;
    if (defaultDir) {
      setProjectDirectory(defaultDir);
      setIsDirectorySelected(true);
      fileSystemService.setRootDirectory(defaultDir);
      onRootDirectoryChange(defaultDir);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleApply = () => {
    onClose();
    onRootDirectoryChange(projectDirectory);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-secondary rounded-lg p-6 w-96 max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-400" />
            <h2 className="text-white text-xl font-semibold">Settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Directory Section */}
          <div>
            <div className="flex justify-between items-center gap-3">
              <label className="block text-gray-300 text-sm text-center font-medium mb-3 whitespace-nowrap">
                Project Directory:
              </label>
              <button
                onClick={handleSelectProjectDirectory}
                className="flex justify-center items-center rounded-md border border-gray-600 p-1 gap-2 text-gray-300 text-sm"
              >
                <Folder className="h-4 w-4 text-gray-500" />
                <span className="w-max[48px] truncate">
                  {truncatePath(projectDirectory)}
                </span>
              </button>
            </div>
          </div>

          {/* Additional Settings Sections */}
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-gray-300 font-medium mb-3">File Management</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Auto-scan on startup</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex justify-between">
                <span>Show hidden files</span>
                <input type="checkbox" className="rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-600">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
