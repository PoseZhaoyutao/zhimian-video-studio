import { useEffect, useState } from "react";
import type { Style, Scene } from "../types";

interface FlowDiagramProps {
  scene: Scene;
  style: Style;
}

export const FlowDiagram = ({ scene, style }: FlowDiagramProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [shimmerPos, setShimmerPos] = useState(-50);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev >= (scene.steps?.length || 0) - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(stepInterval);
  }, [scene.steps?.length]);

  useEffect(() => {
    const shimmerInterval = setInterval(() => {
      setShimmerPos((prev) => (prev >= 150 ? -50 : prev + 2));
    }, 30);
    return () => clearInterval(shimmerInterval);
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

      <div className="flex-1 flex flex-col gap-3 justify-center">
        {scene.steps?.map((step, index) => {
          const isActive = index === activeStep;
          const isPast = index < activeStep;

          return (
            <div
              key={index}
              className="relative rounded-xl p-4 transition-all duration-500"
              style={{
                backgroundColor: isActive
                  ? `${style.primaryColor}20`
                  : style.glowIntensity === "high"
                  ? `${style.textColor}05`
                  : "#f8f8f8",
                border: `2px solid ${isActive ? style.primaryColor : style.borderColor}`,
                opacity: isPast ? 0.6 : 1,
                transform: isActive ? "scale(1.02) translateX(10px)" : "scale(1)",
                boxShadow: isActive
                  ? `0 0 25px ${style.primaryColor}40`
                  : "none",
              }}
            >
              {isActive && (
                <div
                  className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none"
                  style={{ zIndex: 1 }}
                >
                  <div
                    className="absolute top-0 bottom-0 w-32"
                    style={{
                      left: `${shimmerPos}%`,
                      background: `linear-gradient(90deg, transparent, ${style.primaryColor}30, transparent)`,
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-4 relative z-10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: isActive ? style.primaryColor : `${style.primaryColor}20`,
                    color: isActive ? "#fff" : style.primaryColor,
                    boxShadow: isActive ? `0 0 15px ${style.primaryColor}` : "none",
                  }}
                >
                  {index + 1}
                </div>
                <span
                  className="text-lg font-bold flex-1"
                  style={{ color: style.textColor }}
                >
                  {step}
                </span>
                {isActive && (
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: style.primaryColor }}
                  />
                )}
              </div>

              {index < (scene.steps?.length || 0) - 1 && (
                <div className="absolute -bottom-2 left-10 right-10 h-px" style={{ backgroundColor: style.borderColor }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
