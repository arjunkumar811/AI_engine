import { useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initWebContainer() {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Booting WebContainer...");

        const webcontainerInstance = await WebContainer.boot();
        console.log("WebContainer booted successfully");

        setWebcontainer(webcontainerInstance);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to boot WebContainer:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize WebContainer"
        );
        setIsLoading(false);
      }
    }

    initWebContainer();
  }, []);

  return { webcontainer, isLoading, error };
}
