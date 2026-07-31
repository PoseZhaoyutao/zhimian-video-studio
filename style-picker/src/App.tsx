import { useState, useEffect } from "react";
import { Download, RotateCcw, ChevronLeft, ChevronRight, Play, Save } from "lucide-react";
import { STYLES, SCENES } from "./data";
import { StyleSelector } from "./components/StyleSelector";
import { ComparisonPanel } from "./components/ComparisonPanel";
import { FlowDiagram } from "./components/FlowDiagram";
import { FormulaReveal } from "./components/FormulaReveal";
import { CodeCard } from "./components/CodeCard";
import { ProcessDiagram } from "./components/ProcessDiagram";
import type { StyleId, SceneStyleChoice } from "./types";

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 568;

function App() {
  const [sceneStyleChoices, setSceneStyleChoices] = useState<Record<string, StyleId>>({
    hook: "dark-neon",
    intuition: "cream-editorial",
    principle: "ref-comparison",
    followups: "tech-glow",
    answer: "cream-editorial",
    mistake: "dark-neon",
  });

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentScene = SCENES[currentSceneIndex];
  const currentStyle = STYLES[sceneStyleChoices[currentScene.id]];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setCurrentSceneIndex((prev) => (prev >= SCENES.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [isPlaying, currentSceneIndex]);

  const handleStyleChange = (sceneId: string, styleId: StyleId) => {
    setSceneStyleChoices((prev) => ({
      ...prev,
      [sceneId]: styleId,
    }));
  };

  const handleSave = () => {
    const choices: SceneStyleChoice[] = Object.entries(sceneStyleChoices).map(
      ([sceneId, styleId]) => ({
        sceneId,
        styleId,
      })
    );

    const blob = new Blob([JSON.stringify(choices, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "style-choices.json";
    a.click();
    URL.revokeObjectURL(url);

    console.log("Style choices saved:", choices);
  };

  const handleReset = () => {
    setSceneStyleChoices({
      hook: "dark-neon",
      intuition: "cream-editorial",
      principle: "ref-comparison",
      followups: "tech-glow",
      answer: "cream-editorial",
      mistake: "dark-neon",
    });
  };

  const renderSceneContent = () => {
    switch (currentScene.visualType) {
      case "comparison":
        return <ComparisonPanel scene={currentScene} style={currentStyle} />;
      case "flow":
        return <FlowDiagram scene={currentScene} style={currentStyle} />;
      case "formula":
        return <FormulaReveal scene={currentScene} style={currentStyle} />;
      case "code":
        return <CodeCard scene={currentScene} style={currentStyle} />;
      case "process":
        return <ProcessDiagram scene={currentScene} style={currentStyle} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-3">
            视频风格选择器
          </h1>
          <p className="text-gray-400">选择每一段的视觉风格，打造更有冲击力的视频</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCurrentSceneIndex(
                        (prev) => (prev <= 0 ? SCENES.length - 1 : prev - 1)
                      )
                    }
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentSceneIndex(
                        (prev) => (prev >= SCENES.length - 1 ? 0 : prev + 1)
                      )
                    }
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm">重置</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span className="text-sm">保存</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center mb-6">
                <div
                  className="relative rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    width: PREVIEW_WIDTH,
                    height: PREVIEW_HEIGHT,
                    boxShadow: `0 0 50px ${currentStyle.primaryColor}30`,
                  }}
                >
                  {renderSceneContent()}
                </div>
              </div>

              <div className="flex justify-center gap-2">
                {SCENES.map((scene, index) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setCurrentSceneIndex(index);
                      setIsPlaying(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSceneIndex
                        ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-yellow-400" />
                当前片段风格选择
              </h2>
              <StyleSelector
                styles={STYLES}
                selectedStyle={sceneStyleChoices[currentScene.id]}
                onChange={(styleId) => handleStyleChange(currentScene.id, styleId)}
                label={`片段 ${currentSceneIndex + 1}: ${currentScene.title}`}
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-6">所有片段概览</h2>
            <div className="grid grid-cols-2 gap-4">
              {SCENES.map((scene, index) => {
                const style = STYLES[sceneStyleChoices[scene.id]];
                const isActive = index === currentSceneIndex;

                return (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setCurrentSceneIndex(index);
                      setIsPlaying(false);
                    }}
                    className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                      isActive
                        ? "ring-2 ring-white/50 scale-[1.02]"
                        : "hover:scale-[1.01]"
                    }`}
                    style={{
                      width: PREVIEW_WIDTH * 0.5,
                      height: PREVIEW_HEIGHT * 0.5,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ background: style.bgGradient }}
                    />
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center p-3"
                      style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                    >
                      <span
                        className="text-xs font-bold mb-1"
                        style={{ color: style.primaryColor }}
                      >
                        片段 {index + 1}
                      </span>
                      <span
                        className="text-sm font-bold text-center"
                        style={{ color: style.textColor }}
                      >
                        {scene.title}
                      </span>
                      <span
                        className="text-xs mt-1 opacity-70"
                        style={{ color: style.mutedColor }}
                      >
                        {style.name}
                      </span>
                    </div>
                    {isActive && (
                      <div
                        className="absolute inset-0 border-2"
                        style={{ borderColor: style.primaryColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: "#1a1a2e" }}>
              <h3 className="font-bold mb-3 text-sm">风格说明</h3>
              <div className="space-y-2 text-xs">
                {Object.values(STYLES).map((style) => (
                  <div key={style.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ background: style.bgGradient }}
                    />
                    <span className="font-medium" style={{ color: style.textColor }}>
                      {style.name}
                    </span>
                    <span className="opacity-60" style={{ color: style.mutedColor }}>
                      {style.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center text-gray-500 text-sm">
          <p>选择完成后点击「保存」按钮，将生成的 JSON 文件发送给我进行渲染</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
