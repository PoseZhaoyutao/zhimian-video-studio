import { useEffect, useState } from "react";
import type { Style, Scene } from "../types";

interface ProcessDiagramProps {
  scene: Scene;
  style: Style;
}

export const ProcessDiagram = ({ scene, style }: ProcessDiagramProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev >= (scene.steps?.length || 0) - 1 ? 0 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [scene.steps?.length]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const target = ((activeStep + 1) / (scene.steps?.length || 1)) * 100;
        return prev < target ? prev + 2 : prev;
      });
    }, 30);
    return () => clearInterval(progressInterval);
  }, [activeStep, scene.steps?.length]);

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

      <div className="flex-1 flex flex-col justify-center">
        <div className="relative">
          <div className="flex flex-col items-center gap-1">
            {scene.steps?.map((step, index) => {
              const isActive = index === activeStep;
              const isPast = index < activeStep;

              return (
                <div key={index} className="relative">
                  <div
                    className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 ${
                      isActive ? "scale-110" : "scale-100"
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? style.primaryColor
                        : isPast
                        ? `${style.primaryColor}30`
                        : `${style.textColor}10`,
                      border: `2px solid ${isActive ? style.primaryColor : style.borderColor}`,
                      boxShadow: isActive
                        ? `0 0 30px ${style.primaryColor}60`
                        : "none",
                    }}
                  >
                    <span
                      className="text-3xl font-black"
                      style={{
                        color: isActive ? "#fff" : style.textColor,
                        textShadow: isActive ? `0 0 10px #fff` : "none",
                      }}
                    >
                      {index + 1}
                    </span>
                  </div>

                  <div
                    className="mt-3 text-center font-bold"
                    style={{
                      color: isActive ? style.textColor : style.mutedColor,
                      fontSize: isActive ? "18px" : "14px",
                    }}
                  >
                    {step}
                  </div>

                  {index < (scene.steps?.length || 0) - 1 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2">
                      <div
                        className="w-1 h-8"
                        style={{
                          backgroundColor: isPast ? style.primaryColor : style.borderColor,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${style.textColor}10` }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: style.primaryColor,
                boxShadow: `0 0 10px ${style.primaryColor}`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span
              className="text-xs"
              style={{ color: style.mutedColor }}
            >
              {activeStep + 1}/{scene.steps?.length}
            </span>
            <span
              className="text-xs"
              style={{ color: style.mutedColor }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      <div
        className="text-center text-xs opacity-50"
        style={{ color: style.mutedColor }}
      >
        高分回答按四步说
      </div>
    </div>
  );
};
