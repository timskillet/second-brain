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

export function getFilesFromInput(input: string): string[] {
  // Regex to match valid file references: @filename
  // Valid patterns: @file, @file.txt, @file-name, @file_name, @file.name
  // Must be at start of string or preceded by whitespace
  const fileReferenceRegex = /(?:^|\s)@([a-zA-Z0-9._-]+)/g;
  
  const fileReferences: string[] = [];
  let match;
  
  while ((match = fileReferenceRegex.exec(input)) !== null) {
    const filename = match[1];
    // Additional validation: filename should not be empty and should contain at least one alphanumeric character
    if (filename && /[a-zA-Z0-9]/.test(filename)) {
      fileReferences.push(filename);
    }
  }
  
  return fileReferences;
}

export function sanitizeInputFromFileReferences(input: string): string {
  // Remove valid file references from the input string
  // This keeps the text but removes the @filename parts
  const fileReferenceRegex = /(?:^|\s)@([a-zA-Z0-9._-]+)/g;
  
  return input.replace(fileReferenceRegex, (match) => {
    // If the match starts with whitespace, keep the whitespace
    // Otherwise, it was at the start of the string
    return match.startsWith(' ') ? ' ' : '';
  }).replace(/\s+/g, ' ').trim(); // Clean up extra whitespace
}

export function extractFilesAndSanitize(input: string): {
  files: string[];
  sanitizedInput: string;
} {
  return {
    files: getFilesFromInput(input),
    sanitizedInput: sanitizeInputFromFileReferences(input)
  };
}