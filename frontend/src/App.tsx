import React, { useState, useEffect } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import Interface from "./components/interface/Interface";
import type { FileIndex, FileNode } from "./types";
import { buildIndex } from "./utils";
import { fileSystemService } from "./services/fileSystem";
import { getDefaultAppStructure } from "./utils/defaultStructure.ts";
import { DEFAULT_PATHS } from "./config/defaultPaths";

function App() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [fileIndex, setFileIndex] = useState<FileIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rootDirectory, setRootDirectory] = useState<string | null>(null);
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    initializeApp();
  }, []);

  // Helper function to preserve expansion state when updating files
  const preserveExpansionState = (
    newFiles: FileNode[],
    expandedPaths: Set<string>
  ): FileNode[] => {
    return newFiles.map((node) => ({
      ...node,
      isExpanded: expandedPaths.has(node.item.path),
      children:
        node.children.length > 0
          ? preserveExpansionState(node.children, expandedPaths)
          : [],
    }));
  };

  const handleToggleDirectory = (path: string) => {
    setExpandedDirectories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const initializeApp = async () => {
    try {
      setIsLoading(true);

      // Check if we have a saved root directory
      const savedDir = localStorage.getItem("rootDirectory");

      if (savedDir) {
        // Use the previously selected directory from localStorage
        console.log("Using saved directory from localStorage:", savedDir);
        fileSystemService.setRootDirectory(savedDir);
        setRootDirectory(savedDir);

        const projectFiles = await fileSystemService.scanProjectFiles();
        setFiles(projectFiles);
      } else {
        // Check if there's a default directory in configuration
        const defaultDir = DEFAULT_PATHS.ROOT_DIRECTORY;

        if (defaultDir) {
          // Use the default directory from configuration
          console.log(
            "Using default directory from configuration:",
            defaultDir
          );
          fileSystemService.setRootDirectory(defaultDir);
          setRootDirectory(defaultDir);

          const projectFiles = await fileSystemService.scanProjectFiles();
          setFiles(projectFiles);
        } else {
          // No saved directory and no default - show directory selection
          console.log(
            "No saved directory or default found, prompting user to select"
          );
          setFiles(getDefaultAppStructure());
        }
      }
    } catch (error) {
      console.error("Failed to initialize app:", error);
      setFiles(getDefaultAppStructure());
    } finally {
      setIsLoading(false);
    }
  };

  const selectRootDirectory = async () => {
    try {
      setIsLoading(true);

      const selectedDir = await fileSystemService.showDirectoryPicker();
      if (!selectedDir) return;

      fileSystemService.setRootDirectory(selectedDir);
      setRootDirectory(selectedDir);

      // Load files from the selected directory
      const projectFiles = await fileSystemService.scanProjectFiles();
      setFiles(preserveExpansionState(projectFiles, expandedDirectories));
    } catch (error) {
      console.error("Failed to select directory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update file index whenever files change
  useEffect(() => {
    if (files.length > 0) {
      setFileIndex(buildIndex(files));
    }
  }, [files]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Initializing app...</p>
        </div>
      </div>
    );
  }

  // Show directory selection if no root directory
  if (!rootDirectory) {
    return (
      <div className="h-screen flex items-center justify-center bg-primary">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-6">
            Welcome to FileSys
          </h1>
          <p className="text-white mb-8">
            To get started, please select a directory where your files are
            stored.
            <br />
            We'll create an{" "}
            <code className="bg-gray-700 px-2 py-1 rounded">@files</code> folder
            with Documents and Journals.
          </p>
          <button
            onClick={selectRootDirectory}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
          >
            Select Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-primary">
      {/* Sidebar */}
      <div className="flex-shrink-0 bg-secondary">
        <Sidebar
          fileData={files}
          rootDirectory={rootDirectory}
          onRootDirectoryChange={(newDirectory) => {
            setRootDirectory(newDirectory);
            // Reload files from the new directory
            fileSystemService.setRootDirectory(newDirectory);
            fileSystemService
              .scanProjectFiles()
              .then((files) =>
                setFiles(preserveExpansionState(files, expandedDirectories))
              );
          }}
        />
      </div>
      <div className="flex-1 bg-primary">
        <Interface fileIndex={fileIndex} />
      </div>
    </div>
  );
}

export default App;
