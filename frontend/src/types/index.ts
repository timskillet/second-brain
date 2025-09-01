export interface FileItem {
    name: string;
    path: string;
    is_directory: boolean;
    last_modified?: string;
    size?: number;
}

export interface FileNode {
    item: FileItem;
    children: FileNode[];
    id: string;
    isExpanded: boolean;
  }

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    user_id: string;
}

export interface FileIndex {
    id: string;
    name: string;
    path: string;
}

export interface Chat {
    id: string;
    name: string;
}
