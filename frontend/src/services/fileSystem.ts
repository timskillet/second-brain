import { v4 as uuidv4 } from 'uuid';
import type { FileNode, IngestedFile } from '../types';
import axios from 'axios';

export class ElectronFileSystemService {
    private rootDirectory: string | null = null;

    // Set the root directory (no permission needed)
    setRootDirectory(dirPath: string): boolean {
        this.rootDirectory = dirPath;
        // Store in localStorage for persistence
        localStorage.setItem('rootDirectory', dirPath);
        return true;
    }

    // Get the root directory
    getRootDirectory(): string | null {
        if (!this.rootDirectory) {
            this.rootDirectory = localStorage.getItem('rootDirectory');
        }
        return this.rootDirectory;
    }

    // Show directory picker dialog
    async showDirectoryPicker(): Promise<string | null> {
        try {
            const result = await window.electronAPI.showDirectoryDialog();
            if (result.canceled || result.filePaths.length === 0) {
                return null;
            }
            return result.filePaths[0];
        } catch (error) {
            console.error('Failed to show directory dialog:', error);
            return null;
        }
    }

    // Scan project files (no permission needed)
    async scanProjectFiles(): Promise<FileNode[]> {
        const rootDir = this.getRootDirectory();
        if (!rootDir) {
            throw new Error('No root directory set. Please select a directory first.');
        }

        return await this.scanDirectory(rootDir);
    }

    private async scanDirectory(dirPath: string): Promise<FileNode[]> {
        try {
            // Use Electron's file system API
            const items = await window.electronAPI.readDirectory(dirPath);
            
            const files: FileNode[] = [];
            
            for (const item of items) {
                if (item.isDirectory) {
                    const children = await this.scanDirectory(item.path);
                    files.push({
                        item: {
                            name: item.name,
                            path: item.path,
                            is_directory: true,
                            last_modified: item.lastModified,
                        },
                        children,
                        id: uuidv4(),
                        isExpanded: false,
                    });
                } else {
                    files.push({
                        item: {
                            name: item.name,
                            path: item.path,
                            is_directory: false,
                            last_modified: item.lastModified,
                            size: item.size,
                        },
                        children: [],
                        id: uuidv4(),
                        isExpanded: false,
                    });
                }
            }
            
            return files;
        } catch (error) {
            console.error(`Failed to scan directory ${dirPath}:`, error);
            return [];
        }
    }

    // Read file content
    async readFileContent(filePath: string): Promise<string> {
        return await window.electronAPI.readFile(filePath);
    }

    // Write file content
    async writeFile(filePath: string, content: string): Promise<void> {
        await window.electronAPI.writeFile(filePath, content);
    }

    // Create directory
    async createDirectory(dirPath: string): Promise<void> {
        await window.electronAPI.createDirectory(dirPath);
    }

    // Delete file or directory
    async deleteFile(filePath: string): Promise<void> {
        await window.electronAPI.deleteFile(filePath);
    }
}

export class IngestedFileSystemService {

    private api = axios.create({
        baseURL: "http://localhost:8002",
        headers: {
            "Content-Type": "application/json",
        }
    });

    async getIngestedFiles(): Promise<IngestedFile[]> {
        try {
            const response = await this.api.get<IngestedFile[]>("/files");
            return response.data;
        } catch (error) {
            console.error("Error creating chat:", error);
            throw new Error("Failed to create chat");
        }
    }

    async ingestFile(filePath: string): Promise<void> {
        try {
            await this.api.post("/files", { filePath });
        } catch (error) {
            console.error("Error ingesting file:", error);
            throw new Error("Failed to ingest file");
        }
    }

    async deleteFile(fileName: string): Promise<void> {
        try {
            await this.api.delete(`/files/${fileName}`);
        } catch (error) {
            console.error("Error deleting file:", error);
            throw new Error("Failed to delete file");
        }
    }

    async uploadFile(file: File): Promise<{ message: string; filename: string; file_path: string }> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await this.api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            return response.data;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw new Error("Failed to upload file");
        }
    }
}

export const fileSystemService = new ElectronFileSystemService();
export const ingestedFileSystemService = new IngestedFileSystemService();