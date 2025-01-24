import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, Sparkles, Brain, Cpu, Bot } from "lucide-react";

type AIModel = "openai" | "gemini" | "deepseek" | "anthropic";

interface ModelOption {
  id: AIModel;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export const Home = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini");
  const navigate = useNavigate();

  const models: ModelOption[] = [
    {
      id: "openai",
      name: "OpenAI",
      icon: <Sparkles className="w-6 h-6" />,
      description: "Powerful and versatile AI model with broad capabilities",
    },
    {
      id: "gemini",
      name: "Gemini",
      icon: <Brain className="w-6 h-6" />,
      description: "Advanced multimodal AI with strong reasoning abilities",
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      icon: <Cpu className="w-6 h-6" />,
      description: "Specialized in deep technical understanding",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      icon: <Bot className="w-6 h-6" />,
      description: "Focus on safe and ethical AI interactions",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate("/builder", { state: { prompt, model: selectedModel } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
              <Wand2 className="w-14 h-14 text-purple-300" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
            HyperBuild - Website Builder AI
          </h1>
          <p className="text-xl text-purple-200">
            Transform your vision into reality with AI-powered web development
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your dream website in detail..."
              className="w-full h-40 p-4 bg-white/5 text-white border border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-purple-300/50 text-lg"
            />

            <div className="mt-8">
              <h3 className="text-white text-lg mb-4 font-medium">
                Choose your AI Model
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center text-center ${
                      selectedModel === model.id
                        ? "bg-purple-500/20 border-purple-400"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`mb-2 ${
                        selectedModel === model.id
                          ? "text-purple-300"
                          : "text-gray-300"
                      }`}
                    >
                      {model.icon}
                    </div>
                    <h4 className="font-medium text-white mb-1">
                      {model.name}
                    </h4>
                    <p className="text-xs text-purple-200/70">
                      {model.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-lg shadow-lg hover:shadow-purple-500/20"
            >
              Generate Website Plan →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
