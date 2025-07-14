import { WebContainer, FileNode } from "@webcontainer/api";
import { useEffect, useRef, useState } from "react";
import type { FileItem } from "../types";

interface PreviewFrameProps {
  webContainer: WebContainer | null;
  files: FileItem[];
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert FileItem structure to WebContainer FileNode structure
  const convertToFileNode = (items: FileItem[]): Record<string, FileNode> => {
    const result: Record<string, FileNode> = {};

    const processItem = (item: FileItem, basePath: string = "") => {
      const fullPath = basePath ? `${basePath}/${item.name}` : item.name;

      if (item.type === "file") {
        result[fullPath] = {
          file: {
            contents: item.content || "",
          },
        };
      } else if (item.type === "folder" && item.children) {
        result[fullPath] = {
          directory: {},
        };
        item.children.forEach((child) => processItem(child, fullPath));
      }
    };

    items.forEach((item) => processItem(item));
    return result;
  };

  useEffect(() => {
    const startDevServer = async () => {
      console.log("Preview Frame - webContainer:", webContainer);
      console.log("Preview Frame - files:", files);
      console.log("Preview Frame - files length:", files.length);

      if (!webContainer || files.length === 0) {
        setIsLoading(true);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log("Mounting files to WebContainer...");

        // Convert and mount files
        const fileNodes = convertToFileNode(files);
        console.log("File structure:", fileNodes);

        await webContainer.mount(fileNodes);
        console.log("Files mounted successfully");

        // Check if package.json exists
        const packageJsonExists = files.some(
          (file) => file.name === "package.json" && file.type === "file"
        );

        if (!packageJsonExists) {
          console.error("No package.json found in files");
          setError("No package.json found. Cannot start dev server.");
          setIsLoading(false);
          return;
        }

        console.log("Starting npm install...");
        const installProcess = await webContainer.spawn("npm", ["install"]);

        let installOutput = "";
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              installOutput += data;
              console.log("Install:", data);
            },
          })
        );

        const installExitCode = await installProcess.exit;
        console.log("Install exit code:", installExitCode);

        if (installExitCode !== 0) {
          console.error("npm install failed:", installOutput);
          setError("Failed to install dependencies");
          setIsLoading(false);
          return;
        }

        console.log("Starting dev server...");
        const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log("Dev server:", data);
            },
          })
        );

        // Listen for server ready
        webContainer.on("server-ready", (_port, url) => {
          console.log("Server ready on:", url);
          setUrl(url);
          setIsLoading(false);
          if (iframeRef.current) {
            iframeRef.current.src = url;
          }
        });

        // Timeout after 30 seconds
        const timeoutId = setTimeout(() => {
          console.error("Server startup timeout");
          setError("Server startup timeout. Please try again.");
          setIsLoading(false);
        }, 30000);

        // Cleanup timeout if component unmounts
        return () => clearTimeout(timeoutId);
      } catch (err) {
        console.error("Error starting dev server:", err);
        setError(
          `Error: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setIsLoading(false);
      }
    };

    startDevServer();
  }, [webContainer, files]);

  if (!webContainer) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing WebContainer...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">No files to preview yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Generate some code first!
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-6">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Preview Error
          </h3>
          <p className="text-red-700">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up preview...</p>
          <p className="text-sm text-gray-500 mt-2">
            Installing dependencies and starting dev server
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={url}
      width="100%"
      height="100%"
      style={{ border: "none" }}
      title="Preview"
    />
  );
}
