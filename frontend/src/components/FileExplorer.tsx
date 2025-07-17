import React, { useState } from "react";
import { FolderTree, File, ChevronRight, ChevronDown } from "lucide-react";
import type { FileItem } from "../types/index";

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
}

interface FileNodeProps {
  item: FileItem;
  depth: number;
  onFileClick: (file: FileItem) => void;
}

function FileNode({ item, depth, onFileClick }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleClick = () => {
    if (item.type === "folder") {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'tsx' || ext === 'jsx') return '⚛️';
    if (ext === 'ts' || ext === 'js') return '📜';
    if (ext === 'css') return '🎨';
    if (ext === 'html') return '🌐';
    if (ext === 'json') return '📋';
    if (ext === 'md') return '📝';
    return '📄';
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700 rounded cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {item.type === "folder" && (
          <span className="text-gray-400 w-4 flex justify-center">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        )}
        {item.type === "folder" ? (
          <span className="text-blue-400">📁</span>
        ) : (
          <span>{getFileIcon(item.name)}</span>
        )}
        <span className="text-gray-200 truncate">{item.name}</span>
      </div>
      {item.type === "folder" && isExpanded && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, onFileSelect }: FileExplorerProps) {
  return (
    <div className="h-full bg-gray-800 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <FolderTree className="w-4 h-4" />
          Files
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {files.map((file, index) => (
          <FileNode
            key={`${file.path}-${index}`}
            item={file}
            depth={0}
            onFileClick={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}
