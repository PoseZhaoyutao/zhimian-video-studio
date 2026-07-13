import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, EASE, glassStyle, MONO_FAMILY} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/**
 * 代码卡片 — 电影级代码展示
 *
 * 设计哲学：
 * - 代码清晰可读
 * - 玻璃材质增强质感
 * - 克制的动画
 */
export const CodeCard: React.FC<{
  payload: {code: string; language?: string};
  accent: string;
  theme?: "dark" | "cream" | "ref";
}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const code = payload.code ?? "// code here";
  const lines = code.split("\n");

  // 入场动画
  const enter = interpolate(frame, [0, 40], [0, 1], {
    ...clamp,
    easing: EASE.inertial,
  });
  const enterY = (1 - enter) * 50;
  const enterOpacity = enter;

  // 逐行显示
  const lineDuration = 8;
  const lineDelay = 20;

  return (
    <div
      style={{
        ...glassStyle(0.7),
        padding: "36px 40px",
        width: "100%",
        opacity: enterOpacity,
        transform: `translateY(${enterY}px)`,
        position: "relative",
      }}
    >
      {/* 语言标签 */}
      {payload.language && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.textMuted,
            letterSpacing: "0.05em",
          }}
        >
          {payload.language.toUpperCase()}
        </div>
      )}

      {/* 代码内容 */}
      <div
        style={{
          fontFamily: MONO_FAMILY,
          fontSize: 26,
          lineHeight: 1.6,
          color: COLORS.textPrimary,
        }}
      >
        {lines.map((line, i) => {
          const lineEnter = interpolate(
            frame,
            [lineDelay + i * lineDuration, lineDelay + i * lineDuration + 20],
            [0, 1],
            {...clamp, easing: EASE.standard}
          );

          return (
            <div
              key={i}
              style={{
                opacity: lineEnter,
                transform: `translateX(${(1 - lineEnter) * -20}px)`,
              }}
            >
              <span style={{color: COLORS.textMuted, marginRight: 16}}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
