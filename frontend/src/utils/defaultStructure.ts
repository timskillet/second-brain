import { v4 as uuidv4 } from 'uuid';
import type { FileNode } from '../types';

// Default app directory structure that mirrors @files/
export function getDefaultAppStructure(): FileNode[] {
  return [
    {
      item: {
        name: "Documents",
        path: "/Documents",
        is_directory: true,
        last_modified: new Date().toISOString(),
      },
      children: [],
      id: uuidv4(),
      isExpanded: false,
    },
    {
      item: {
        name: "Journals",
        path: "/Journals",
        is_directory: true,
        last_modified: new Date().toISOString(),
      },
      children: [],
      id: uuidv4(),
      isExpanded: false,
    },
  ];
}
