import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { StepsList } from "../components/StepsList";
import { FileExplorer } from "../components/FileExplorer";
import { TabView } from "../components/TabView";
import { CodeEditor } from "../components/CodeEditor";
import { PreviewFrame } from "../components/PreviewFrame";
import { Step, FileItem, StepType } from "../types";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { parseXml } from "../steps";
import { useWebContainer } from "../hooks/useWebContainer";
import { Loader } from "../components/Loader";
import {
  Code2,
  Command,
  MessageSquarePlus,
  Rocket,
  Sparkles,
} from "lucide-react";

export function Builder() {
  const location = useLocation();
  const { prompt, model } = location.state as { prompt: string; model: string };
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const { webContainer, isReady } = useWebContainer();

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
  }, [steps, files]);

  useEffect(() => {
    if (!isReady || !webContainer) return;

    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: FileItem): any => {
        if (file.type === "folder") {
          return {
            directory: file.children
              ? Object.fromEntries(
                  file.children.map((child) => [child.name, processFile(child)])
                )
              : {},
          };
        } else if (file.type === "file") {
          return {
            file: {
              contents: file.content || "",
            },
          };
        }
      };

      files.forEach((file) => {
        mountStructure[file.name] = processFile(file); // Properly add to the structure
      });

      return mountStructure;
    };
    console.log("files", files);
    const mountStructure = createMountStructure(files);
    console.log("mount structure", mountStructure);
    webContainer.mount(mountStructure);
  }, [files, webContainer, isReady]);

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
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat/${model}`, {
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
        status: "pending" as "pending",
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
  console.log("webc", webContainer);

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700/50 backdrop-blur-sm px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Command className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                HyperBuild
              </h1>
            </div>
            <div className="h-6 w-px bg-gray-700/50" />
            <p className="text-sm text-gray-400">
              <span className="text-gray-500">Prompt:</span>{" "}
              <span className="text-gray-300">{prompt}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2 text-sm">
              <Code2 className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors duration-200 flex items-center gap-2 text-sm font-medium">
              <Rocket className="w-4 h-4" />
              <span>Deploy</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-7rem)]">
          {/* Left Sidebar - Steps */}
          <div className="col-span-3 flex flex-col gap-6">
            <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-gray-200 font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Build Steps
                </h2>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(100vh-24rem)]">
                <StepsList
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                />
              </div>
            </div>

            {/* Chat Input */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
              {loading || !templateSet ? (
                <div className="flex items-center justify-center p-4">
                  <Loader />
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your instructions here..."
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-24 text-sm"
                  />
                  <button
                    onClick={async () => {
                      if (!userPrompt.trim()) return;

                      const newMessage = {
                        role: "user" as "user",
                        content: userPrompt,
                      };

                      setLoading(true);
                      const stepsResponse = await axios.post(
                        `${BACKEND_URL}/chat/${model}`,
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
                        ...parseXml(stepsResponse.data.response).map((x) => ({
                          ...x,
                          status: "pending" as "pending",
                        })),
                      ]);

                      setPrompt("");
                    }}
                    className="w-full px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !userPrompt.trim()}
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    Send Instructions
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* File Explorer */}
          <div className="col-span-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50">
              <h2 className="text-gray-200 font-medium flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                Project Files
              </h2>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
              <FileExplorer files={files} onFileSelect={setSelectedFile} />
            </div>
          </div>

          {/* Editor/Preview */}
          <div className="col-span-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden flex flex-col">
            <div className="border-b border-gray-700/50">
              <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === "code" && webContainer ? (
                <CodeEditor file={selectedFile} />
              ) : (
                webContainer && (
                  <PreviewFrame webContainer={webContainer} files={files} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
