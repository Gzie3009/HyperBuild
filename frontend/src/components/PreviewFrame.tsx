import { WebContainer } from "@webcontainer/api";
import React, { useEffect, useState } from "react";

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("Installing dependencies...");

  // Function to install dependencies
  async function installDependencies() {
    const installProcess = await webContainer.spawn("npm", ["install"]);

    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log("Install Output:", data);
        },
      })
    );

    // Wait for installation to complete
    const exitCode = await installProcess.exit;

    if (exitCode !== 0) {
      throw new Error(`Installation failed with code ${exitCode}`);
    }

    return exitCode;
  }

  // Function to start the development server
  async function startDevServer() {
    setStatus("Starting development server...");

    // Start the dev server
    const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

    // Listen for server output
    devProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log("Dev Output:", data);
          // Look for the Vite local URL in the output
          if (data.includes("Local:")) {
            const match = data.match(/Local:\s*(http:\/\/localhost:\d+)/);
            if (match && match[1]) {
              setUrl(match[1]);
            }
          }
        },
      })
    );

    // Handle server ready event
    webContainer.on("server-ready", (port, url) => {
      console.log("Server is ready at:", url);
      setUrl(url);
      setStatus("");
    });

    // Error handling
    devProcess.exit.then((code) => {
      if (code !== 0) {
        setStatus(`Dev server exited with code ${code}`);
      }
    });
  }

  // Main function to initialize and start the WebContainer environment
  async function main() {
    try {
      await installDependencies();
      console.log("Dependencies installed successfully");
      await startDevServer();
    } catch (error) {
      console.error("Error during WebContainer setup:", error);
      setStatus(`Error: ${error}`);
    }
  }

  // Run the main function when the component is mounted
  useEffect(() => {
    main();
  }, []);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url && (
        <div className="text-center">
          <p className="mb-2">{status}</p>
        </div>
      )}
      {url && <iframe width="100%" height="100%" src={url} />}
    </div>
  );
}
