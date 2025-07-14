import { WebContainer } from "@webcontainer/api";

export async function testWebContainer(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("Testing WebContainer support...");

    // Check if WebContainer is available
    if (typeof WebContainer === "undefined") {
      return { success: false, error: "WebContainer is not available" };
    }

    // Try to boot WebContainer
    const webcontainer = await WebContainer.boot();
    console.log("WebContainer test successful:", webcontainer);

    return { success: true };
  } catch (error) {
    console.error("WebContainer test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
