import { useEffect, useState } from "react";
import type { Style, Scene } from "../types";

interface FormulaRevealProps {
  scene: Scene;
  style: Style;
}

export const FormulaReveal = ({ scene, style }: FormulaRevealProps) => {
  const [revealedTokens, setRevealedTokens] = useState<number>(0);
  const [glowPulse, setGlowPulse] = useState(0);

  useEffect(() => {
    const tokenInterval = setInterval(() => {
      setRevealedTokens((prev) => {
        if (prev >= (scene.tokens?.length || 0)) {
          setTimeout(() => setRevealedTokens(0), 3000);
          return 0;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(tokenInterval);
  }, [scene.tokens?.length]);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setGlowPulse((prev) => (prev >= 1 ? 0 : prev + 0.02));
    }, 30);
    return () => clearInterval(pulseInterval);
  }, []);

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

      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {scene.tokens?.map((token, index) => {
            const isRevealed = index < revealedTokens;
            const isLast = index === revealedTokens - 1;

            return (
              <div
                key={index}
                className="transition-all duration-500"
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
                }}
              >
                <div
                  className={`px-6 py-3 rounded-xl font-bold text-2xl ${
                    isLast ? "ring-2" : ""
                  }`}
                  style={{
                    backgroundColor: token === "=" || token === "+"
                      ? `${style.accentColor}10`
                      : `${style.primaryColor}15`,
                    color: token === "=" || token === "+"
                      ? style.accentColor
                      : style.textColor,
                    border: `2px solid ${token === "=" || token === "+" ? style.accentColor : style.borderColor}`,
                    boxShadow: isLast
                      ? `0 0 30px ${style.primaryColor}50`
                      : "none",
                    textShadow: isLast && style.glowIntensity === "high"
                      ? `0 0 15px ${style.primaryColor}`
                      : "none",
                  }}
                >
                  {token}
                </div>
                {isLast && (
                  <div
                    className="absolute -inset-4 rounded-2xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${style.primaryColor}20 0%, transparent 70%)`,
                      opacity: Math.sin(glowPulse * Math.PI) * 0.5 + 0.5,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="text-center text-xs opacity-50"
        style={{ color: style.mutedColor }}
      >
        System Design Primer — Donne Martin
      </div>
    </div>
  );
};
