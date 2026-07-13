import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, EASE, glassStyle} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/**
 * 公式展示 — 电影级数学可视化
 *
 * 设计哲学：
 * - 公式作为焦点，清晰可读
 * - 体积光强调重要性
 * - 克制的动画，不抢视觉
 */
export const FormulaReveal: React.FC<{
  payload: {formula: string; source?: string};
  accent: string;
  theme?: "dark" | "cream" | "ref";
}> = ({payload, accent}) => {
  const frame = useCurrentFrame();

  // 入场动画
  const enter = interpolate(frame, [0, 40], [0, 1], {
    ...clamp,
    easing: EASE.inertial,
  });
  const enterY = (1 - enter) * 40;
  const enterScale = 0.9 + enter * 0.1;

  // 体积光呼吸
  const glowPulse = (Math.sin(frame / 80) + 1) / 2;
  const glowOpacity = 0.15 + glowPulse * 0.1;

  // 来源标签
  const sourceEnter = interpolate(frame, [30, 60], [0, 1], {
    ...clamp,
    easing: EASE.standard,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        width: "100%",
        position: "relative",
      }}
    >
      {/* 体积光背景 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 600,
          height: 300,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse at center, ${accent}${Math.round(glowOpacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          filter: "blur(60px)",
          opacity: enter,
          pointerEvents: "none",
        }}
      />

      {/* 公式卡片 */}
      <div
        style={{
          ...glassStyle(0.7),
          padding: "48px 64px",
          opacity: enter,
          transform: `translateY(${enterY}px) scale(${enterScale})`,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontFamily: '"Cascadia Code", "SF Mono", monospace',
            letterSpacing: "-0.02em",
            textShadow: `0 0 20px ${accent}40`,
          }}
        >
          {payload.formula}
        </div>
      </div>

      {/* 来源标签 */}
      {payload.source && (
        <div
          style={{
            ...glassStyle(0.4),
            fontSize: 22,
            fontWeight: 600,
            color: COLORS.textSecondary,
            padding: "8px 20px",
            borderRadius: 12,
            opacity: sourceEnter,
            transform: `translateY(${(1 - sourceEnter) * 20}px)`,
          }}
        >
          {payload.source}
        </div>
      )}
    </div>
  );
};
