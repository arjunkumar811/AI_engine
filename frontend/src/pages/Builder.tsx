import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { StepsList } from "../components/StepsList";
import { FileExplorer } from "../components/FileExplorer";
import { TabView } from "../components/TabView";
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
  const [templateSet, setTemplateSet] = useState(false);
  const {
    webcontainer,
    isLoading: webContainerLoading,
    error: webContainerError,
  } = useWebContainer();

  console.log("Builder - WebContainer state:", {
    webcontainer,
    webContainerLoading,
    webContainerError,
  });

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
    console.log("Builder - Updated files:", originalFiles);
    console.log("Builder - Files length:", originalFiles.length);
  }, [steps, files]);

  useEffect(() => {
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
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...prompts, prompt].map((content) => ({
          role: "user",
          content,
        })),
      });

      setLoading(false);

      setSteps((s) => [
        ...s,
        ...parseXml(stepsResponse.data.response).map((x) => ({
          ...x,
          status: "pending" as const,
        })),
      ]);

      setLlmMessages(
        [...prompts, prompt].map((content) => ({
          role: "user",
          content,
        }))
      );

      setLlmMessages((x) => [
        ...x,
        { role: "assistant", content: stepsResponse.data.response },
      ]);
    }

    init();
  }, [prompt]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-100">Website Builder</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-6 p-6">
          <div className="col-span-1 space-y-6 overflow-auto">
            <div>
              <div className="max-h-[75vh] overflow-scroll">
                <StepsList
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                />
              </div>
              <div>
                <div className="flex">
                  <br />
                  {(loading || !templateSet) && <Loader />}
                  {!(loading || !templateSet) && (
                    <div className="w-full bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-100 mb-3">
                        Continue Building
                      </h3>
                      <div className="space-y-3">
                        <textarea
                          value={userPrompt}
                          onChange={(e) => {
                            setPrompt(e.target.value);
                          }}
                          placeholder="Ask for modifications, add features, or refine your project..."
                          className="w-full p-3 bg-gray-900 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-400"
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={async () => {
                              if (!userPrompt.trim()) return;

                              const newMessage = {
                                role: "user" as const,
                                content: userPrompt,
                              };

                              setLoading(true);
                              const stepsResponse = await axios.post(
                                `${BACKEND_URL}/chat`,
                                {
                                  messages: [...llmMessages, newMessage],
                                }
                              );
                              setLoading(false);

                              setLlmMessages((x) => [...x, newMessage]);
                              setLlmMessages((x) => [
                                ...x,
                                {
                                  role: "assistant",
                                  content: stepsResponse.data.response,
                                },
                              ]);

                              setSteps((s) => [
                                ...s,
                                ...parseXml(stepsResponse.data.response).map(
                                  (x) => ({
                                    ...x,
                                    status: "pending" as const,
                                  })
                                ),
                              ]);

                              setPrompt(""); // Clear the input after sending
                            }}
                            disabled={!userPrompt.trim() || loading}
                            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-500 disabled:hover:to-purple-600"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                  />
                                </svg>
                                <span>Send Message</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-1">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>
          <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="h-[calc(100%-4rem)]">
              {activeTab === "code" ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame
                  webContainer={webcontainer || null}
                  files={files}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
