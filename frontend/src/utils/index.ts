import type { FileIndex, FileNode } from "../types";

export function buildIndex(tree: FileNode[], parentPath = ""): FileIndex[] {
    let index: FileIndex[] = [];
    for (const node of tree) {
      const fullPath = parentPath ? `${parentPath}/${node.item.name}` : node.item.name;
      if (node.item.is_directory === false) {
        index.push({ id: node.id, name: node.item.name, path: fullPath });
      }
      if (node.children) {
        index = index.concat(buildIndex(node.children, fullPath));
      }
    }
    return index;
  }

export function truncatePath(path: string, maxLength = 30) {
  if (path.length <= maxLength) return path;

  const parts = path.split("\\"); // Split by Windows-style path
  const first = parts[0]; // Usually drive letter
  const last = parts.slice(-2).join("\\"); // Last two folders

  return `${first}\\...\\${last}`;
}