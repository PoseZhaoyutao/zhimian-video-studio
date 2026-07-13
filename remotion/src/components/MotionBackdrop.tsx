import {useCurrentFrame} from "remotion";
import {COLORS} from "../design";

const seeded = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * 电影级背景 — 深邃空间感
 *
 * 设计哲学：
 * - 多层渐变营造深度，不是扁平背景
 * - 方向性体积光，不是随机发光
 * - 极少量粒子，有目的性
 * - 暗角聚焦，引导视觉到中心
 */
export const MotionBackdrop: React.FC<{accent: string; variant?: string; theme?: "dark" | "cream" | "ref"}> = ({
  accent,
  variant = "editorial",
  theme = "ref",
}) => {
  const frame = useCurrentFrame();
  const rng = seeded(42);

  // 呼吸动画 — 缓慢、克制
  const breathe = Math.sin(frame / 120) * 0.5 + 0.5;
  const breathe2 = Math.sin(frame / 150 + 1) * 0.5 + 0.5;

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none"}}>
      {/* Layer 1: 深空径向渐变 — 有色彩倾向，不是纯黑 */}
      <div
        style={{
          position: "absolute",
          inset: -100,
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.spaceLight} 0%, ${COLORS.space} 45%, ${COLORS.spaceDeep} 100%)`,
        }}
      />

      {/* Layer 2: 主体积光 — 从顶部中心向下，有方向性 */}
      <div
        style={{
          position: "absolute",
          top: -300,
          left: "50%",
          width: 900,
          height: 1400,
          transform: `translateX(-50%) scale(${1 + breathe * 0.03})`,
          background: `linear-gradient(
            to bottom,
            ${COLORS.volLight.core} 0%,
            ${COLORS.volLight.mid} 30%,
            ${COLORS.volLight.edge} 60%,
            transparent 85%
          )`,
          opacity: 0.6 + breathe * 0.1,
          filter: "blur(80px)",
          borderRadius: "50% 50% 40% 40%",
        }}
      />

      {/* Layer 3: 辅助体积光 — 从右侧，营造层次 */}
      <div
        style={{
          position: "absolute",
          top: 100,
          right: -200,
          width: 600,
          height: 1000,
          transform: `rotate(-25deg) scale(${1 + breathe2 * 0.02})`,
          background: `linear-gradient(
            135deg,
            rgba(56,189,248,0.08) 0%,
            rgba(108,99,255,0.04) 40%,
            transparent 70%
          )`,
          opacity: 0.5 + breathe2 * 0.08,
          filter: "blur(60px)",
          borderRadius: "40% 60% 50% 50%",
        }}
      />

      {/* Layer 4: 极细网格 — 增加质感，不抢视觉 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(108,99,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108,99,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          backgroundPosition: `0px ${(frame * 0.15) % 60}px`,
          opacity: 0.5,
        }}
      />

      {/* Layer 5: 极少量环境粒子 — 有目的，不是random */}
      {Array.from({length: 5}).map((_, index) => {
        const x = rng() * 800 + 140;
        const baseY = rng() * 1400 + 300;
        const size = 2 + rng() * 1.5;
        const speed = 150 + index * 20;
        const yOff = Math.sin(frame / speed + index) * 8;
        const xOff = Math.cos(frame / (speed + 30) + index) * 4;
        const opacity = 0.15 + Math.sin(frame / (100 + index * 10) + index) * 0.05;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x + xOff,
              top: baseY + yOff,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: index % 2 === 0 ? COLORS.primaryLight : COLORS.accentLight,
              opacity,
              boxShadow: `0 0 ${size * 4}px rgba(108,99,255,0.4)`,
            }}
          />
        );
      })}

      {/* Layer 6: 暗角 — 聚焦视觉到中心 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(8,6,20,0.5) 75%, rgba(4,2,16,0.8) 100%)`,
        }}
      />

      {/* Layer 7: 顶部柔光 — 增加空间深度 */}
      <div
        style={{
          position: "absolute",
          top: -150,
          left: "50%",
          width: 1000,
          height: 400,
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse at center, ${COLORS.volLight.mid} 0%, transparent 65%)`,
          opacity: 0.4 + breathe * 0.08,
          filter: "blur(40px)",
        }}
      />
    </div>
  );
};
