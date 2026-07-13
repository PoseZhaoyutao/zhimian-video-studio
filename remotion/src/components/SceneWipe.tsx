import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, EASE} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/**
 * 场景转场 — 电影级径向遮罩
 *
 * 设计哲学：
 * - 平滑过渡，不突兀
 * - 体积光增强空间感
 * - 克制的动画
 */
export const SceneWipe: React.FC<{
  accent: string;
  theme?: "dark" | "cream" | "ref";
}> = () => {
  const frame = useCurrentFrame();

  // 30帧后返回null
  if (frame > 30) {
    return null;
  }

  // 径向遮罩扩散
  const scale = interpolate(frame, [0, 30], [0, 1.2], {
    ...clamp,
    easing: EASE.dramatic,
  });

  // 透明度
  const opacity = interpolate(frame, [0, 15, 30], [0, 0.9, 0], {
    ...clamp,
    easing: EASE.dramatic,
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 40,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 主体径向遮罩 */}
      <div
        style={{
          width: 2800,
          height: 2800,
          borderRadius: "50%",
          background: `radial-gradient(circle at center, ${COLORS.space} 0%, ${COLORS.spaceDeep} 70%, transparent 100%)`,
          transform: `scale(${scale})`,
          opacity,
        }}
      />
      {/* 体积光边缘 */}
      <div
        style={{
          position: "absolute",
          width: 2800,
          height: 2800,
          borderRadius: "50%",
          border: `3px solid ${COLORS.primary}40`,
          boxShadow: `0 0 60px ${COLORS.primaryGlow}`,
          transform: `scale(${scale})`,
          opacity: opacity * 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
