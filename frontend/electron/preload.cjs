const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  createDirectory: (path) => ipcRenderer.invoke('create-directory', path),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  showDirectoryDialog: () => ipcRenderer.invoke('show-directory-dialog'),
  showFileDialog: (options) => ipcRenderer.invoke('show-file-dialog', options)
});