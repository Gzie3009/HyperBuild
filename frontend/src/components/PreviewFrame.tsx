import { WebContainer } from "@webcontainer/api";
import React, { useEffect, useState, useRef } from "react";
import { Loader } from "./Loader";
import { Terminal, RefreshCw } from "lucide-react";

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("Preparing development environment...");
  const [error, setError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const installationComplete = useRef(false);
  const serverStarted = useRef(false);

  // Function to install dependencies with caching
  async function installDependencies() {
    if (installationComplete.current) {
      console.log("Dependencies already installed, skipping...");
      return 0;
    }

    setStatus("Installing dependencies...");

    try {
      const installProcess = await webContainer.spawn("npm", ["install"]);

      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            if (data.includes("ERR!")) {
              console.error("Install Error:", data);
              setError(data);
            } else {
              console.log("Install Progress:", data);
              // Update status with meaningful progress
              if (data.includes("added")) {
                setStatus("Installing packages...");
              } else if (data.includes("packages")) {
                setStatus("Finalizing installation...");
              }
            }
          },
        })
      );

      const exitCode = await installProcess.exit;

      if (exitCode !== 0) {
        throw new Error(`Installation failed with code ${exitCode}`);
      }

      installationComplete.current = true;
      return exitCode;
    } catch (error) {
      console.error("Installation error:", error);
      setError(`Installation failed: ${error.message}`);
      throw error;
    }
  }

  // Function to start the development server
  async function startDevServer() {
    if (serverStarted.current) {
      console.log("Server already running, skipping...");
      return;
    }

    setStatus("Starting development server...");

    try {
      const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

      let serverStartTimeout = setTimeout(() => {
        setError("Server start timeout - taking longer than expected");
      }, 30000); // 30 second timeout

      devProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log("Dev Output:", data);

            if (data.includes("EADDRINUSE")) {
              setError("Port is already in use. Please try again.");
              return;
            }

            // Look for the Vite local URL in the output
            if (data.includes("Local:")) {
              const match = data.match(/Local:\s*(http:\/\/localhost:\d+)/);
              if (match && match[1]) {
                clearTimeout(serverStartTimeout);
                setUrl(match[1]);
                serverStarted.current = true;
                setStatus("");
              }
            }
          },
        })
      );

      // Handle server ready event
      webContainer.on("server-ready", (port, url) => {
        console.log("Server is ready at:", url);
        clearTimeout(serverStartTimeout);
        setUrl(url);
        serverStarted.current = true;
        setStatus("");
      });

      devProcess.exit.then((code) => {
        if (code !== 0) {
          setError(`Dev server exited with code ${code}`);
          serverStarted.current = false;
        }
      });
    } catch (error) {
      console.error("Server start error:", error);
      setError(`Failed to start server: ${error.message}`);
      throw error;
    }
  }

  // Function to reload the container
  async function reloadContainer() {
    try {
      setIsReloading(true);
      setError(null);
      setUrl("");
      serverStarted.current = false;

      // Kill all running processes
      const processes = await webContainer.spawn("pkill", ["-f", "node"]);
      await processes.exit;

      // Restart the server
      await startDevServer();
    } catch (error) {
      console.error("Reload error:", error);
      setError(`Failed to reload: ${error.message}`);
    } finally {
      setIsReloading(false);
    }
  }

  // Main function to initialize and start the WebContainer environment
  async function main() {
    try {
      await installDependencies();
      await startDevServer();
    } catch (error) {
      console.error("Error during WebContainer setup:", error);
      setError(`Setup failed: ${error}`);
    }
  }

  // Run the main function when the component is mounted
  useEffect(() => {
    main();

    // Cleanup function
    return () => {
      serverStarted.current = false;
    };
  }, []);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 p-6">
        <Terminal className="w-8 h-8 mb-4" />
        <p className="text-center mb-2">Something went wrong:</p>
        <pre className="bg-red-900/20 p-4 rounded-lg text-sm max-w-full overflow-auto">
          {error}
        </pre>
        <button
          onClick={reloadContainer}
          disabled={isReloading}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center gap-2 text-sm transition-colors duration-200"
        >
          <RefreshCw
            className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`}
          />
          {isReloading ? "Reloading..." : "Try Again"}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900/50">
      <div className="p-2 flex justify-end">
        <button
          onClick={reloadContainer}
          disabled={isReloading}
          className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg flex items-center gap-2 text-sm text-gray-300 transition-colors duration-200"
        >
          <RefreshCw
            className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`}
          />
          {isReloading ? "Reloading..." : "Reload"}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {!url && (
          <div className="text-center space-y-4">
            <Loader className="w-8 h-8" />
            <p className="text-gray-400 animate-pulse">{status}</p>
          </div>
        )}
        {url && (
          <iframe
            title="Preview"
            width="100%"
            height="100%"
            src={url}
            className="bg-white"
          />
        )}
      </div>
    </div>
  );
}
