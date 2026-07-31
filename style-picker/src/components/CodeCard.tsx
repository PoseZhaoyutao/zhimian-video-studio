import { useEffect, useState } from "react";
import type { Style, Scene } from "../types";

interface CodeCardProps {
  scene: Scene;
  style: Style;
}

export const CodeCard = ({ scene, style }: CodeCardProps) => {
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const text = scene.code || "";
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index <= text.length) {
        setTypedText(text.slice(0, index));
        index++;
      } else {
        setTimeout(() => {
          setTypedText("");
          index = 0;
        }, 4000);
      }
    }, 50);
    return () => clearInterval(typeInterval);
  }, [scene.code]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const lines = typedText.split("\n");

  return (
    <div className="relative w-full h-full flex flex-col gap-4 p-6" style={{ background: style.bgGradient }}>
      <div className="text-center">
        <div
          className="text-2xl font-black"
          style={{ color: style.textColor }}
        >
          {scene.title}
        </div>
        <div className="text-sm mt-1 opacity-70" style={{ color: style.mutedColor }}>
          {scene.subtitle}
        </div>
      </div>

      <div
        className="flex-1 rounded-xl p-4 font-mono text-sm overflow-hidden relative"
        style={{
          backgroundColor: style.glowIntensity === "high" ? "#0a0a0a" : "#f5f5f5",
          border: `2px solid ${style.borderColor}`,
          boxShadow: style.glowIntensity === "high" ? `0 0 20px ${style.primaryColor}20` : "none",
        }}
      >
        <div className="flex gap-2 mb-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff5f56" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ffbd2e" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#27ca40" }} />
        </div>

        <div className="space-y-2">
          {lines.map((line, lineIndex) => {
            const isLastLine = lineIndex === lines.length - 1;
            const qMatch = line.match(/^(Q\d+):/);

            return (
              <div key={lineIndex} className="flex gap-2">
                <span className="text-gray-500 select-none w-6">{lineIndex + 1}</span>
                <span
                  className={`flex-1 ${qMatch ? "font-bold" : ""}`}
                  style={{
                    color: qMatch ? style.accentColor : style.textColor,
                    textShadow: style.glowIntensity === "high" ? `0 0 5px ${style.primaryColor}30` : "none",
                  }}
                >
                  {line}
                  {isLastLine && cursorVisible && (
                    <span
                      className="inline-block w-2 h-4 ml-0.5 align-middle"
                      style={{
                        backgroundColor: style.primaryColor,
                        boxShadow: `0 0 8px ${style.primaryColor}`,
                      }}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: `radial-gradient(ellipse at 30% 70%, ${style.primaryColor}10 0%, transparent 50%)`,
          }}
        />
      </div>

      <div
        className="text-center text-xs opacity-50"
        style={{ color: style.mutedColor }}
      >
        追问链决定上限
      </div>
    </div>
  );
};
