import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { StepsList } from "../components/StepsList";
import { FileExplorer } from "../components/FileExplorer";
import { CodeEditor } from "../components/CodeEditor";
import { PreviewFrame } from "../components/PreviewFrame";
import { StepType } from "../types/index";
import type { Step, FileItem } from "../types/index";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { parseXml } from "../steps";
import { useWebContainer } from "../hooks/useWebContainer";
import { FileNode } from "@webcontainer/api";
import { Loader } from "../components/Loader";

const MOCK_FILE_CONTENT = `// This is a sample file content
import React from 'react';

function Component() {
  return <div>Hello World</div>;
}

export default Component;`;

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps
      .filter(({ status }) => status === "pending")
      .map((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
          let currentFileStructure = [...originalFiles]; // {}
          let finalAnswerRef = currentFileStructure;

          let currentFolder = "";
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              // final file
              let file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "file",
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              /// in a folder
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                // create the folder
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "folder",
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => {
          return {
            ...s,
            status: "completed",
          };
        })
      );
    }
    console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: FileItem, isRootFolder: boolean) => {
        if (file.type === "folder") {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children
              ? Object.fromEntries(
                  file.children.map((child) => [
                    child.name,
                    processFile(child, false),
                  ])
                )
              : {},
          };
        } else if (file.type === "file") {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || "",
              },
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || "",
              },
            };
          }
        }

        return mountStructure[file.name];
      };

      // Process each top-level file/folder
      files.forEach((file) => processFile(file, true));

      return mountStructure;
    };

    const mountStructure = createMountStructure(files);

    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  const handleStreamResponse = async (messages: any[]) => {
    setStreaming(true);
    setStreamingContent("");
    
    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'token') {
                fullContent += data.content;
                
                setStreamingContent(fullContent);
                
                try {
                  const parsedSteps = parseXml(fullContent);
                  if (parsedSteps.length > 0) {
                    setSteps((prev) => {
                      const existingCompleted = prev.filter(s => s.status === "completed");
                      return [
                        ...existingCompleted,
                        ...parsedSteps.map((x: Step) => ({
                          ...x,
                          status: "pending" as const,
                        })),
                      ];
                    });
                  }
                } catch {
                  
                }
              } else if (data.type === 'done') {
                setStreaming(false);
                setStreamingContent("");
                setLlmMessages((x) => [
                  ...x,
                  { role: "assistant", content: fullContent },
                ]);
                
                const finalSteps = parseXml(fullContent);
                setSteps((prev) => {
                  const existingCompleted = prev.filter(s => s.status === "completed");
                  return [
                    ...existingCompleted,
                    ...finalSteps.map((x: Step) => ({
                      ...x,
                      status: "pending" as const,
                    })),
                  ];
                });
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch {
              
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setStreaming(false);
      setStreamingContent("");
    }
  };

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim(),
    });
    setTemplateSet(true);

    const { prompts, uiPrompts } = response.data;

    setSteps(
      parseXml(uiPrompts[0]).map((x: Step) => ({
        ...x,
        status: "pending",
      }))
    );

    setLoading(true);
    const messages = [...prompts, prompt].map((content) => ({
      role: "user" as const,
      content,
    }));

    setLlmMessages(messages);
    await handleStreamResponse(messages);
    setLoading(false);
  }

  useEffect(() => {
    async function initTemplate() {
      await init();
    }
    initTemplate();
  }, [prompt]);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Website Builder</h2>
              <p className="text-xs text-blue-400">I'll help you build amazing websites</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-600">
            <p className="text-xs text-gray-300 font-medium mb-1">Building:</p>
            <p className="text-sm text-white truncate">{prompt}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {(loading || !templateSet) ? (
            <div className="p-4">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-lg p-4 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-400 font-medium text-sm">Building your project...</span>
                </div>
                <p className="text-gray-300 text-xs mb-2">Let me set up everything for you:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    Analyzing your requirements
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    Setting up project structure
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    Generating initial code
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="text-sm font-medium text-gray-300">Project Steps</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <StepsList
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={setCurrentStep}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-700">
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-400 text-lg">🚀</span>
                    <h3 className="text-sm font-medium text-purple-300">Ready to continue building?</h3>
                  </div>
                  <p className="text-xs text-gray-400">Tell me what you'd like to add or modify, and I'll help you build it!</p>
                </div>
                
                <div className="space-y-3">
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        if (!userPrompt.trim() || streaming) return;
                        
                        const newMessage = {
                          role: "user" as const,
                          content: userPrompt,
                        };

                        setLlmMessages((x) => [...x, newMessage]);
                        setPrompt("");
                        handleStreamResponse([...llmMessages, newMessage]);
                      }
                    }}
                    placeholder="Describe what you want to add or modify..."
                    className="w-full p-3 bg-gray-900 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-400 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={async () => {
                      if (!userPrompt.trim()) return;

                      const newMessage = {
                        role: "user" as const,
                        content: userPrompt,
                      };

                      setLlmMessages((x) => [...x, newMessage]);
                      setPrompt("");
                      await handleStreamResponse([...llmMessages, newMessage]);
                    }}
                    disabled={!userPrompt.trim() || streaming}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-lg"
                  >
                    {streaming ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Building magic...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">✨</span>
                        <span>Let's Build This!</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-80 bg-gray-800 border-r border-gray-700">
          <FileExplorer files={files} onFileSelect={setSelectedFile} />
        </div>
        
        <div className="flex-1 flex">
          <div className="flex-1 bg-gray-900">
            <div className="h-full flex flex-col">
              <div className="flex bg-gray-800 border-b border-gray-700">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "code"
                      ? "bg-gray-700 text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Code Editor
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-gray-700 text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Preview
                </button>
              </div>
              
              <div className="flex-1">
                {activeTab === "code" ? (
                  <CodeEditor 
                    file={selectedFile} 
                    streaming={streaming}
                    streamingContent={streamingContent}
                  />
                ) : (
                  <PreviewFrame webContainer={webcontainer || null} files={files} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
