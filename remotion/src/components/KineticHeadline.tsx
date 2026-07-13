import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, EASE} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/**
 * 苹果级排版冲击力标题
 *
 * 设计哲学：
 * - 超大字号，粗字重
 * - 清晰的层级
 * - 克制的动画
 */
export const KineticHeadline: React.FC<{
  text: string;
  accent: string;
  theme?: "dark" | "cream" | "ref";
}> = ({text, accent}) => {
  const frame = useCurrentFrame();

  // 入场动画 — scale 0.92 → 1, opacity 0 → 1
  const enterScale = interpolate(frame, [0, 40], [0.92, 1], {
    ...clamp,
    easing: EASE.inertial,
  });
  const enterOpacity = interpolate(frame, [0, 40], [0, 1], {
    ...clamp,
    easing: EASE.inertial,
  });

  // 下划线生长 — delay 25帧
  const underlineScaleX = interpolate(frame, [25, 55], [0, 1], {
    ...clamp,
    easing: EASE.standard,
  });

  // 呼吸浮动
  const breatheY = Math.sin(frame / 100) * 2;

  return (
    <div
      style={{
        position: "relative",
        paddingBottom: 28,
        transform: `translateY(${breatheY}px)`,
      }}
    >
      <div
        style={{
          fontSize: 88,
          fontWeight: 900,
          letterSpacing: -4,
          lineHeight: 1.05,
          color: COLORS.textPrimary,
          textShadow: `0 0 40px ${accent}40`,
          opacity: enterOpacity,
          transform: `scale(${enterScale})`,
          transformOrigin: "left center",
        }}
      >
        {text}
      </div>
      {/* 下划线 — 带辉光 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "55%",
          height: 5,
          borderRadius: 3,
          backgroundColor: accent,
          boxShadow: `0 0 16px ${accent}60`,
          transformOrigin: "left center",
          transform: `scaleX(${underlineScaleX})`,
        }}
      />
    </div>
  );
};
