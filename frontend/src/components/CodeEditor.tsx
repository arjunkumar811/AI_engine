import React from "react";
import Editor from "@monaco-editor/react";
import type { FileItem } from "../types/index";

interface CodeEditorProps {
  file: FileItem | null;
  streaming?: boolean;
  streamingContent?: string;
}

export function CodeEditor({ file, streaming, streamingContent }: CodeEditorProps) {
  if (streaming && streamingContent) {
    const extractCodeFromResponse = (content: string) => {
      const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
      const fileBlockRegex = /<boltArtifact[^>]*id="([^"]*)"[^>]*title="([^"]*)"[^>]*>\s*<boltAction[^>]*type="file"[^>]*filePath="([^"]*)"[^>]*>([\s\S]*?)<\/boltAction>\s*<\/boltArtifact>/g;
      
      let match = fileBlockRegex.exec(content);
      if (match) {
        const [, id, title, filePath, fileContent] = match;
        return {
          fileName: filePath.split('/').pop() || 'Generated File',
          filePath,
          content: fileContent.trim(),
          language: getLanguageFromPath(filePath)
        };
      }
      
      match = codeBlockRegex.exec(content);
      if (match) {
        return {
          fileName: 'Generated Code',
          filePath: 'generated.tsx',
          content: match[1],
          language: 'typescript'
        };
      }
      
      return {
        fileName: 'Streaming...',
        filePath: 'stream.txt',
        content: content,
        language: 'typescript'
      };
    };

    const extractedCode = extractCodeFromResponse(streamingContent);

    return (
      <div className="h-full bg-[#1e1e1e] flex flex-col">
        <div className="bg-[#2d2d30] px-4 py-2 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400 font-medium">
              {extractedCode.fileName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">Generating code...</div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            language={extractedCode.language}
            theme="vs-dark"
            value={extractedCode.content}
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
        <div className="text-center">
          <div className="mb-4 text-gray-500">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-300 mb-2">No file selected</p>
          <p className="text-sm text-gray-500">Choose a file from the explorer to view its contents</p>
        </div>
      </div>
    );
  }

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
