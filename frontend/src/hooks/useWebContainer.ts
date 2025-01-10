import { useEffect, useState, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

let webContainerInstance: WebContainer | null = null; // Singleton instance

export function useWebContainer() {
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initializeWebContainer = useCallback(async () => {
    if (!webContainerInstance) {
      webContainerInstance = await WebContainer.boot();
    }
    setWebContainer(webContainerInstance);
    setIsReady(true);
  }, []);

  const teardownWebContainer = useCallback(async () => {
    // if (webContainerInstance) {
    //   await webContainerInstance.teardown();
    //   webContainerInstance = null;
    // }
    // setWebContainer(null);
    setIsReady(false);
  }, []);

  useEffect(() => {
    initializeWebContainer();

    return () => {
      teardownWebContainer();
    };
  }, [initializeWebContainer, teardownWebContainer]);

  return { webContainer, isReady };
}
