import React, { useState, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import type { FileItem } from "../types/index";

interface CodeEditorProps {
  file: FileItem | null;
  streaming?: boolean;
  streamingContent?: string;
}

export function CodeEditor({ file, streaming, streamingContent }: CodeEditorProps) {
  const [displayContent, setDisplayContent] = useState("");
  const [currentFile, setCurrentFile] = useState<{
    fileName: string;
    filePath: string;
    content: string;
    language: string;
  } | null>(null);

  const getLanguageFromPath = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': case 'c': return 'cpp';
      default: return 'typescript';
    }
  };

  const extractLatestFileContent = useMemo(() => {
    if (!streamingContent) return null;

    const fileBlocks = streamingContent.match(/<boltAction[^>]*type="file"[^>]*filePath="([^"]*)"[^>]*>([\s\S]*?)<\/boltAction>/g);
    
    if (fileBlocks && fileBlocks.length > 0) {
      const lastBlock = fileBlocks[fileBlocks.length - 1];
      const pathMatch = lastBlock.match(/filePath="([^"]*)"/);
      const contentMatch = lastBlock.match(/<boltAction[^>]*>([\s\S]*?)<\/boltAction>/);
      
      if (pathMatch && contentMatch) {
        const filePath = pathMatch[1];
        const content = contentMatch[1].trim();
        
        return {
          fileName: filePath.split('/').pop() || 'Generated File',
          filePath,
          content,
          language: getLanguageFromPath(filePath)
        };
      }
    }

    const codeBlocks = streamingContent.match(/```(\w+)?\n([\s\S]*?)```/g);
    if (codeBlocks && codeBlocks.length > 0) {
      const lastBlock = codeBlocks[codeBlocks.length - 1];
      const match = lastBlock.match(/```(\w+)?\n([\s\S]*?)```/);
      if (match) {
        return {
          fileName: 'Generated Code',
          filePath: 'generated.tsx',
          content: match[2],
          language: match[1] || 'typescript'
        };
      }
    }

    return null;
  }, [streamingContent]);

  useEffect(() => {
    if (streaming && extractLatestFileContent) {
      setCurrentFile(extractLatestFileContent);
      setDisplayContent(extractLatestFileContent.content);
    }
  }, [streaming, extractLatestFileContent]);

  if (streaming && currentFile) {
    return (
      <div className="h-full bg-[#1e1e1e] flex flex-col">
        <div className="bg-[#2d2d30] px-4 py-3 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <div>
              <span className="text-sm text-green-400 font-medium">
                {currentFile.fileName}
              </span>
              <div className="text-xs text-gray-400">AI is building this for you...</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">✨ Generating magic</span>
            </div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            language={currentFile.language}
            theme="vs-dark"
            value={displayContent}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              folding: true,
              automaticLayout: true,
              scrollbar: {
                vertical: "auto",
                horizontal: "auto"
              },
              renderLineHighlight: "none",
            }}
          />
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 bg-[#1e1e1e]">
        <div className="text-center max-w-md">
          <div className="mb-6 text-gray-500">
            <div className="relative">
              <svg className="w-20 h-20 mx-auto text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👨‍💻</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-300">Ready to see some code?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Select a file from the explorer on the left to view its contents, or ask me to generate new code!
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mt-4">
              <span>💡</span>
              <span>Tip: I can help you build amazing features</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      <div className="bg-[#2d2d30] px-4 py-2 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-300 font-medium">{file.name}</span>
          <span className="text-xs text-gray-500 ml-auto">{file.path}</span>
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguageFromPath(file.path)}
          theme="vs-dark"
          value={file.content || ""}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            folding: true,
            automaticLayout: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto"
            },
          }}
        />
      </div>
    </div>
  );
}
