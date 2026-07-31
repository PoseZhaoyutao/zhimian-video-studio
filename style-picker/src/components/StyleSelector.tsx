import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import type { Style, StyleId } from "../types";

interface StyleSelectorProps {
  styles: Record<string, Style>;
  selectedStyle: StyleId;
  onChange: (styleId: StyleId) => void;
  label: string;
}

export const StyleSelector = ({ styles, selectedStyle, onChange, label }: StyleSelectorProps) => {
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <Sparkles className="w-4 h-4 text-yellow-400" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(styles).map((style) => {
          const isSelected = selectedStyle === style.id;
          const isHovered = hoveredStyle === style.id;

          return (
            <button
              key={style.id}
              onClick={() => onChange(style.id)}
              onMouseEnter={() => setHoveredStyle(style.id)}
              onMouseLeave={() => setHoveredStyle(null)}
              className={`relative overflow-hidden rounded-xl p-3 transition-all duration-300 ${
                isSelected
                  ? "ring-2 ring-white/50 shadow-lg shadow-white/10 scale-[1.02]"
                  : "hover:scale-[1.01] hover:shadow-md"
              }`}
              style={{
                background: style.bgGradient,
                border: `2px solid ${isSelected ? style.primaryColor : "transparent"}`,
              }}
            >
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  background: `radial-gradient(circle at center, ${style.primaryColor}10 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-bold text-sm"
                    style={{ color: style.textColor }}
                  >
                    {style.name}
                  </span>
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: style.primaryColor }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p
                  className="text-xs opacity-70 line-clamp-2"
                  style={{ color: style.mutedColor }}
                >
                  {style.description}
                </p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    isSelected ? "scale-x-100" : "scale-x-0"
                  }`}
                  style={{
                    backgroundColor: style.primaryColor,
                    boxShadow: `0 0 10px ${style.primaryColor}`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
