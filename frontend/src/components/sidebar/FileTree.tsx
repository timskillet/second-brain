import { ChevronDown, ChevronRight, Folder, FileIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { FileNode, IngestedFile } from "../../types";
import Menu from "../Menu";

interface FileTreeProps {
  fileData: FileNode[];
  ingestedFiles: IngestedFile[];
  onFileSelect?: (node: FileNode) => void;
  onCreateFile?: (
    parentPath: string,
    name: string,
    isDirectory: boolean
  ) => Promise<void>;
  onAction?: (action: string, item: FileNode) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

const FileTree = ({
  fileData,
  ingestedFiles,
  onFileSelect,
  onCreateFile,
  onAction,
  onRefresh,
}: FileTreeProps) => {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    item: FileNode | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Update expansion state when fileData changes (e.g., after refresh)
  useEffect(() => {
    // Preserve existing expansion state for paths that still exist
    setExpandedPaths((prev) => {
      const newSet = new Set<string>();
      const allPaths = new Set<string>();

      // Collect all existing paths from new fileData
      const collectPaths = (nodes: FileNode[]) => {
        nodes.forEach((node) => {
          allPaths.add(node.item.path);
          if (node.children.length > 0) {
            collectPaths(node.children);
          }
        });
      };
      collectPaths(fileData);

      // Only keep expansion state for paths that still exist
      prev.forEach((path) => {
        if (allPaths.has(path)) {
          newSet.add(path);
        }
      });

      return newSet;
    });
  }, [fileData]);

  const toggleDirectory = (path: string) => {
    console.log("FileTree: Toggling directory:", path);
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
        console.log("FileTree: Collapsing directory:", path);
      } else {
        newSet.add(path);
        console.log("FileTree: Expanding directory:", path);
      }
      return newSet;
    });
  };

  const isExpanded = (path: string): boolean => {
    return expandedPaths.has(path);
  };

  const handleFileClick = (node: FileNode) => {
    setSelectedFile(node);
    if (onFileSelect) {
      onFileSelect(node);
    }
  };

  const handleCreateFile = async (
    parentPath: string,
    name: string,
    isDirectory: boolean
  ) => {
    if (onCreateFile) {
      try {
        setIsLoading(true);
        await onCreateFile(parentPath, name, isDirectory);
        // Refresh the file tree after creation
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error("Failed to create file:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMenuAction = async (action: string, item: FileNode) => {
    if (onAction) {
      try {
        setIsLoading(true);
        await onAction(action, item);
        // Refresh the file tree after action
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error(`Failed to perform action ${action}:`, error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderFileTree = (node: FileNode): React.ReactNode => {
    return (
      <div key={node.item.path}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (node.item.is_directory) {
              toggleDirectory(node.item.path);
            }
            handleFileClick(node);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({
              x: e.clientX,
              y: e.clientY,
              item: node,
            });
          }}
          className="cursor-pointer"
        >
          <div
            className={`flex m-1 items-center hover:bg-hover rounded-lg p-1 flex-1 ${
              selectedFile?.item.path === node.item.path ? "bg-hover" : ""
            }`}
          >
            {node.item.is_directory ? (
              <div className="p-1 rounded mr-1">
                {isExpanded(node.item.path) ? (
                  <ChevronDown className="text-gray-300 h-3 w-3" />
                ) : (
                  <ChevronRight className="text-gray-300 h-3 w-3" />
                )}
              </div>
            ) : (
              <div className="w-5 mr-1" />
            )}

            {node.item.is_directory ? (
              <Folder className="h-4 w-4 mr-2 text-gray-300" />
            ) : (
              <FileIcon className="h-4 w-4 text-gray-500 mr-2" />
            )}

            <span className="flex-1 text-gray-300 truncate">
              {node.item.name}
            </span>

            {isLoading && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 ml-2" />
            )}
          </div>

          {/* Render children if directory is expanded */}
          {node.item.is_directory &&
            isExpanded(node.item.path) &&
            node.children.length > 0 && (
              <div className="ml-4">
                {node.children.map((child) => renderFileTree(child))}
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderIngestedFileTree = (file: IngestedFile): React.ReactNode => {
    return (
      <div key={file.id}>
        <div
          className={`flex m-1 items-center hover:bg-hover rounded-lg p-1 flex-1`}
        >
          <FileIcon className="h-4 w-4 text-gray-500 mr-2" />
          <span className="flex-1 text-gray-300 truncate">{file.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {ingestedFiles.map((file) => renderIngestedFileTree(file))}
      {fileData.map((node) => renderFileTree(node))}
      {menu && (
        <Menu
          x={menu.x}
          y={menu.y}
          item={menu.item}
          onAction={handleMenuAction}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
};

export default FileTree;
