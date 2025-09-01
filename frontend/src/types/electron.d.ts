declare global {
    interface Window {
      electronAPI: {
        readDirectory: (path: string) => Promise<any[]>;
        readFile: (path: string) => Promise<string>;
        writeFile: (path: string, content: string) => Promise<boolean>;
        createDirectory: (path: string) => Promise<boolean>;
        deleteFile: (path: string) => Promise<boolean>;
        showDirectoryDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
        showFileDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
      };
    }
  }
  
  export {};