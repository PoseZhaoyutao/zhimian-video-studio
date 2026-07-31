import { useEffect, useState } from "react";
import type { Style, Scene } from "../types";

interface ComparisonPanelProps {
  scene: Scene;
  style: Style;
}

export const ComparisonPanel = ({ scene, style }: ComparisonPanelProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; opacity: number; size: number }>>([]);
  const [glowIntensity, setGlowIntensity] = useState(0.5);

  useEffect(() => {
    const initialParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.2,
      size: Math.random() * 4 + 2,
    }));
    setParticles(initialParticles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity((prev) => (prev >= 1 ? 0.3 : prev + 0.02));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const winnerColor = scene.winner === "right" ? style.secondaryColor : style.primaryColor;
  const loserColor = scene.winner === "left" ? style.secondaryColor : style.primaryColor;

  return (
    <div className="relative w-full h-full flex flex-col gap-4 p-6" style={{ background: style.bgGradient }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: style.accentColor,
              opacity: p.opacity * glowIntensity,
              boxShadow: `0 0 ${p.size * 3}px ${style.accentColor}`,
            }}
          />
        ))}
      </div>

      <div className="text-center mb-2">
        <div
          className="text-4xl font-black tracking-tight"
          style={{
            color: style.textColor,
            textShadow: style.glowIntensity === "high" ? `0 0 30px ${style.primaryColor}` : "none",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          {scene.title}
        </div>
        <div className="text-sm mt-2 opacity-70" style={{ color: style.mutedColor }}>
          {scene.subtitle}
        </div>
      </div>

      <div className="flex gap-3 flex-1">
        <div
          className="flex-1 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: style.glowIntensity === "high" ? `${style.primaryColor}10` : "#fff",
            border: `3px solid ${loserColor}`,
            boxShadow: style.glowIntensity === "high" ? `0 0 20px ${loserColor}30` : "none",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${loserColor}05 0%, transparent 50%)`,
            }}
          />
          <span
            className="text-xl font-bold mb-4 relative z-10"
            style={{ color: loserColor }}
          >
            {scene.leftLabel}
          </span>
          <div
            className="text-5xl font-black relative z-10"
            style={{
              color: loserColor,
              textShadow: `0 0 20px ${loserColor}`,
            }}
          >
            ✕
          </div>
        </div>

        <div
          className="flex-1 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: style.glowIntensity === "high" ? `${style.secondaryColor}10` : "#fff",
            border: `3px solid ${winnerColor}`,
            boxShadow: style.glowIntensity === "high" ? `0 0 30px ${winnerColor}50` : "none",
            animation: "breath 3s ease-in-out infinite",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${winnerColor}05 0%, transparent 50%)`,
            }}
          />
          <span
            className="text-xl font-bold mb-4 relative z-10"
            style={{ color: winnerColor }}
          >
            {scene.rightLabel}
          </span>
          <div
            className="text-5xl font-black relative z-10"
            style={{
              color: winnerColor,
              textShadow: `0 0 20px ${winnerColor}`,
            }}
          >
            ✓
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes breath {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px ${winnerColor}50; }
          50% { transform: scale(1.02); box-shadow: 0 0 40px ${winnerColor}80; }
        }
      `}</style>
    </div>
  );
};
