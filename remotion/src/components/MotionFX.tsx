/**
 * HyperFrames-style motion effects for Remotion (v4).
 *
 * 两类动效：
 * A) 瞬时触发型（原 v3）：MarkerSweep / BurstLines / SketchCircle / KineticText
 *    / GlitchShift / ParticleBurst / ScanLine / ClipReveal / PulseRing
 * B) 持续运动型（v4 新增，HyperFrames 标志性能力）：FlowField / IdleFloat
 *    / CursorTrail / ParallaxLayer / TypewriterLine / GlitchBar / ShimmerText
 *    / BreathingGlow
 *
 * v4 spring 配置全部增强冲击感：damping 6-12, stiffness 220-320。
 */

import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// 确定性伪随机（mulberry32），避免帧间抖动
const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* ════════════════════ 瞬时触发型 ════════════════════ */

/* ────────────────────── MarkerSweep ────────────────────── */
/** 倾斜光带从左到右扫过元素，营造高亮标记效果。 */
export const MarkerSweep: React.FC<{
  delay?: number;
  color?: string;
  width?: number;
  skew?: number;
  repeat?: number;
  repeatGap?: number;
}> = ({
  delay = 0,
  color = "rgba(255,255,255,0.35)",
  width = 25,
  skew = -20,
  repeat = 0,
  repeatGap = 60,
}) => {
  const frame = useCurrentFrame();
  const cycleLen = 30;
  const totalCycles = repeat + 1;

  const sweeps = Array.from({length: totalCycles}, (_, i) => {
    const start = delay + i * (cycleLen + repeatGap);
    const progress = interpolate(frame, [start, start + cycleLen], [0, 1], clamp);
    return {progress, start, active: frame >= start && frame <= start + cycleLen};
  });

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none"}}>
      {sweeps.map((s, i) =>
        s.active ? (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-20%",
              bottom: "-20%",
              left: 0,
              width: `${width}%`,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              transform: `translateX(${s.progress * 400 - 100}%) skewX(${skew}deg)`,
              mixBlendMode: "screen",
            }}
          />
        ) : null
      )}
    </div>
  );
};

/* ────────────────────── BurstLines ────────────────────── */
/** 从中心点向外发射的 SVG 线条，强调爆发感。 */
export const BurstLines: React.FC<{
  delay?: number;
  count?: number;
  radius?: number;
  color?: string;
  lineWidth?: number;
}> = ({
  delay = 0,
  count = 10,
  radius = 120,
  color = "#FF2D55",
  lineWidth = 3,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rng = mulberry32(42);
  const duration = 25;

  const lines = Array.from({length: count}, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.3;
    const len = radius * (0.6 + rng() * 0.5);
    const lineDelay = delay + Math.floor(rng() * 6);
    const enter = spring({frame: frame - lineDelay, fps, config: {damping: 8, stiffness: 320, mass: 0.5}});
    const fade = interpolate(frame, [lineDelay + 15, lineDelay + duration], [1, 0], clamp);
    const x1 = Math.cos(angle) * 20;
    const y1 = Math.sin(angle) * 20;
    const x2 = Math.cos(angle) * (20 + len * enter);
    const y2 = Math.sin(angle) * (20 + len * enter);
    return {x1, y1, x2, y2, opacity: fade, lineWidth: lineWidth * (0.5 + rng() * 0.5)};
  });

  return (
    <svg
      style={{position: "absolute", inset: 0, pointerEvents: "none"}}
      viewBox="-200 -200 400 400"
      preserveAspectRatio="xMidYMid meet"
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={color}
          strokeWidth={l.lineWidth}
          strokeLinecap="round"
          opacity={l.opacity}
        />
      ))}
    </svg>
  );
};

/* ────────────────────── SketchCircle ────────────────────── */
/** 手绘风格圆圈强调，SVG 描边动画从 0 到完整。 */
export const SketchCircle: React.FC<{
  delay?: number;
  size?: number;
  color?: string;
  strokeWidth?: number;
  x?: string;
  y?: string;
}> = ({
  delay = 0,
  size = 80,
  color = "#E63946",
  strokeWidth = 4,
  x = "50%",
  y = "50%",
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const r = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * r;
  const drawProgress = spring({frame: frame - delay, fps, config: {damping: 12, stiffness: 220, mass: 0.8}});
  const dashOffset = circumference * (1 - drawProgress);
  const wobble = Math.sin((frame - delay) * 0.3) * 2 * (frame > delay + 20 ? 0 : 1);

  return (
    <svg
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) rotate(${-15 + wobble}deg)`,
        pointerEvents: "none",
        zIndex: 10,
      }}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  );
};

/* ────────────────────── KineticText ────────────────────── */
/** 逐字弹入动态排版，每个字符独立 spring 动画。 */
export const KineticText: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
  mode?: "rise" | "pop" | "blur" | "scatter";
}> = ({
  text,
  delay = 0,
  stagger = 3,
  fontSize = 48,
  color = "#FFFFFF",
  fontWeight = 800,
  lineHeight = 1.3,
  style,
  mode = "rise",
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chars = Array.from(text);

  return (
    <div
      style={{
        display: "inline-block",
        fontSize,
        color,
        fontWeight,
        lineHeight,
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const charDelay = delay + i * stagger;
        const enter = spring({frame: frame - charDelay, fps, config: {damping: 8, stiffness: 300, mass: 0.6}});

        let transform = "";
        let opacity = enter;
        let filter = "none";

        if (mode === "rise") {
          transform = `translateY(${(1 - enter) * 40}px)`;
        } else if (mode === "pop") {
          transform = `scale(${0.3 + enter * 0.7})`;
        } else if (mode === "blur") {
          transform = `translateY(${(1 - enter) * 20}px)`;
          filter = `blur(${(1 - enter) * 8}px)`;
        } else if (mode === "scatter") {
          const rng = mulberry32(i * 137);
          const dx = (rng() - 0.5) * 60;
          const dy = (rng() - 0.5) * 60;
          transform = `translate(${dx * (1 - enter)}px, ${dy * (1 - enter)}px) rotate(${(1 - enter) * 30}deg)`;
        }

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform,
              opacity,
              filter,
              whiteSpace: ch === " " ? "pre" : "normal",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/* ────────────────────── GlitchShift ────────────────────── */
/** 故障偏移效果：RGB 分离 + 水平抖动，营造数字故障感。 */
export const GlitchShift: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  intensity?: number;
}> = ({
  children,
  delay = 0,
  duration = 15,
  intensity = 8,
}) => {
  const frame = useCurrentFrame();
  const active = frame >= delay && frame <= delay + duration;
  const t = frame - delay;

  const shift = active
    ? Math.sin(t * 0.8) * intensity * (1 - t / duration)
    : 0;
  const shiftY = active
    ? Math.cos(t * 1.2) * intensity * 0.3 * (1 - t / duration)
    : 0;

  return (
    <div style={{position: "relative", display: "inline-block"}}>
      <div
        style={{
          position: active ? "absolute" : "static",
          top: 0,
          left: 0,
          transform: `translate(${shift}px, ${shiftY}px)`,
          color: "rgba(255,0,60,0.7)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: active ? "absolute" : "static",
          top: 0,
          left: 0,
          transform: `translate(${-shift}px, ${-shiftY}px)`,
          color: "rgba(0,100,255,0.7)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      >
        {children}
      </div>
      <div style={{position: "relative", zIndex: 1}}>{children}</div>
    </div>
  );
};

/* ────────────────────── ParticleBurst ────────────────────── */
/** 粒子爆发：从中心点向外飞散的粒子，强调冲击瞬间。 */
export const ParticleBurst: React.FC<{
  delay?: number;
  count?: number;
  color?: string;
  maxSize?: number;
  spread?: number;
}> = ({
  delay = 0,
  count = 16,
  color = "#FFB300",
  maxSize = 8,
  spread = 200,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rng = mulberry32(99);

  const particles = Array.from({length: count}, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.5;
    const speed = spread * (0.5 + rng() * 0.6);
    const pDelay = delay + Math.floor(rng() * 3);
    const enter = spring({frame: frame - pDelay, fps, config: {damping: 6, stiffness: 300, mass: 0.4}});
    const fade = interpolate(frame, [pDelay + 10, pDelay + 30], [1, 0], clamp);
    const x = Math.cos(angle) * speed * enter;
    const y = Math.sin(angle) * speed * enter + (frame - pDelay) * 0.5;
    const size = maxSize * (0.4 + rng() * 0.6) * (1 - enter * 0.3);
    return {x, y, size, opacity: fade, rotation: rng() * 360};
  });

  return (
    <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none"}}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: color,
            borderRadius: "50%",
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${color}80`,
          }}
        />
      ))}
    </div>
  );
};

/* ────────────────────── ScanLine ────────────────────── */
/** 水平扫描线从上到下扫过元素，科技感。 */
export const ScanLine: React.FC<{
  delay?: number;
  duration?: number;
  color?: string;
  thickness?: number;
}> = ({
  delay = 0,
  duration = 40,
  color = "rgba(38,92,255,0.6)",
  thickness = 2,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + duration], [0, 100], clamp);
  const glow = interpolate(frame, [delay, delay + 5, delay + duration - 5, delay + duration], [0, 1, 1, 0], clamp);

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${progress}%`,
          height: thickness,
          backgroundColor: color,
          boxShadow: `0 0 ${20 * glow}px ${color}, 0 0 ${40 * glow}px ${color}`,
          opacity: glow,
        }}
      />
    </div>
  );
};

/* ────────────────────── ClipReveal ────────────────────── */
/** clip-path 遮罩揭示：从左到右或从中心展开。 */
export const ClipReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: "left" | "right" | "center" | "top";
  duration?: number;
}> = ({
  children,
  delay = 0,
  direction = "left",
  duration = 20,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({frame: frame - delay, fps, config: {damping: 10, stiffness: 280, mass: 0.6}});

  let clipPath = "none";
  if (direction === "left") {
    clipPath = `inset(0 ${100 - progress * 100}% 0 0)`;
  } else if (direction === "right") {
    clipPath = `inset(0 0 0 ${100 - progress * 100}%)`;
  } else if (direction === "center") {
    clipPath = `inset(0 ${(100 - progress * 100) / 2}%)`;
  } else if (direction === "top") {
    clipPath = `inset(0 0 ${100 - progress * 100}% 0)`;
  }

  return <div style={{clipPath}}>{children}</div>;
};

/* ────────────────────── PulseRing ────────────────────── */
/** 脉冲圆环：从中心向外扩散的圆环，强调焦点。 */
export const PulseRing: React.FC<{
  delay?: number;
  repeat?: number;
  gap?: number;
  color?: string;
  maxRadius?: number;
  thickness?: number;
}> = ({
  delay = 0,
  repeat = 2,
  gap = 30,
  color = "#265CFF",
  maxRadius = 100,
  thickness = 3,
}) => {
  const frame = useCurrentFrame();
  const cycleLen = 25;
  const rings = Array.from({length: repeat}, (_, i) => {
    const start = delay + i * (cycleLen + gap);
    const progress = interpolate(frame, [start, start + cycleLen], [0, 1], clamp);
    const opacity = interpolate(frame, [start, start + cycleLen], [0.8, 0], clamp);
    return {progress, opacity, active: frame >= start && frame <= start + cycleLen + 5};
  });

  return (
    <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none"}}>
      {rings.map((r, i) =>
        r.active ? (
          <div
            key={i}
            style={{
              position: "absolute",
              width: r.progress * maxRadius * 2,
              height: r.progress * maxRadius * 2,
              borderRadius: "50%",
              border: `${thickness}px solid ${color}`,
              opacity: r.opacity,
            }}
          />
        ) : null
      )}
    </div>
  );
};

/* ════════════════════ 持续运动型（v4 新增） ════════════════════ */
/* HyperFrames 标志性能力：画面始终在呼吸，元素永不静止。        */

/* ────────────────────── FlowField ────────────────────── */
/** 持续流动的渐变背景层：conic-gradient 旋转 + 缓慢呼吸。
 *  营造"画面始终在动"的氛围层，对应 HyperFrames 的 ambient 背景。 */
export const FlowField: React.FC<{
  color1?: string;
  color2?: string;
  color3?: string;
  opacity?: number;
  speed?: number;       // 旋转速度（每帧度数）
  breathSpeed?: number; // 呼吸速度
}> = ({
  color1 = "rgba(255,45,85,0.15)",
  color2 = "rgba(0,212,255,0.12)",
  color3 = "rgba(255,179,0,0.08)",
  opacity = 0.35,
  speed = 0.4,
  breathSpeed = 0.02,
}) => {
  const frame = useCurrentFrame();
  const rotation = frame * speed;
  const breath = 0.85 + Math.sin(frame * breathSpeed) * 0.15;

  return (
    <div
      style={{
        position: "absolute",
        inset: "-20%",
        background: `conic-gradient(from ${rotation}deg at 50% 50%, ${color1}, ${color2}, ${color3}, ${color1})`,
        opacity: opacity * breath,
        filter: "blur(60px)",
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    />
  );
};

/* ────────────────────── IdleFloat ────────────────────── */
/** 元素 idle 时的细微浮动：永不停止的 sin 波形浮动。
 *  HyperFrames 原则：元素入场后不静止，持续微动保持"活气"。 */
export const IdleFloat: React.FC<{
  children: React.ReactNode;
  amplitude?: number;   // 浮动幅度 px
  speed?: number;       // 浮动速度
  rotateAmp?: number;   // 旋转幅度 deg
  delay?: number;       // 开始浮动前的延迟
}> = ({
  children,
  amplitude = 6,
  speed = 0.04,
  rotateAmp = 0.8,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - delay);
  const y = Math.sin(t * speed) * amplitude;
  const x = Math.cos(t * speed * 0.7) * amplitude * 0.5;
  const rot = Math.sin(t * speed * 0.5) * rotateAmp;

  return (
    <div style={{transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`}}>
      {children}
    </div>
  );
};

/* ────────────────────── CursorTrail ────────────────────── */
/** 光标跟随轨迹：移动的光点 + 拖尾，模拟 HyperFrames 的 cursor 动效。
 *  用于 code 场景的终端光标、或者公式场景的强调点。 */
export const CursorTrail: React.FC<{
  delay?: number;
  fromX?: string;  // CSS 百分比
  fromY?: string;
  toX?: string;
  toY?: string;
  color?: string;
  size?: number;
  trailLength?: number;
  duration?: number;
}> = ({
  delay = 0,
  fromX = "20%",
  fromY = "50%",
  toX = "80%",
  toY = "50%",
  color = "#00D4FF",
  size = 16,
  trailLength = 8,
  duration = 40,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + duration], [0, 1], clamp);

  // 解析百分比坐标
  const fx = parseFloat(fromX);
  const fy = parseFloat(fromY);
  const tx = parseFloat(toX);
  const ty = parseFloat(toY);
  const cx = fx + (tx - fx) * progress;
  const cy = fy + (ty - fy) * progress;

  // 拖尾点
  const trail = Array.from({length: trailLength}, (_, i) => {
    const tp = Math.max(0, progress - i * 0.04);
    const txPos = fx + (tx - fx) * tp;
    const tyPos = fy + (ty - fy) * tp;
    return {x: txPos, y: tyPos, opacity: 1 - i / trailLength, size: size * (1 - i / trailLength * 0.5)};
  });

  return (
    <div style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
      {trail.map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: t.size,
            height: t.size,
            borderRadius: "50%",
            backgroundColor: color,
            transform: "translate(-50%, -50%)",
            opacity: t.opacity * 0.6,
            boxShadow: `0 0 ${t.size}px ${color}`,
          }}
        />
      ))}
      {/* 主光点 — 闪烁 */}
      <div
        style={{
          position: "absolute",
          left: `${cx}%`,
          top: `${cy}%`,
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: color,
          transform: "translate(-50%, -50%)",
          opacity: 0.7 + Math.sin(frame * 0.5) * 0.3,
          boxShadow: `0 0 ${size * 1.5}px ${color}, 0 0 ${size * 3}px ${color}80`,
        }}
      />
    </div>
  );
};

/* ────────────────────── ParallaxLayer ────────────────────── */
/** 3D 视差层：基于帧的 translateZ 模拟，多层叠加产生纵深感。
 *  HyperFrames 原则：建立 z 轴层次，不是平面贴纸。 */
export const ParallaxLayer: React.FC<{
  children: React.ReactNode;
  depth?: number;      // 0-1，0=远（不动），1=近（动最多）
  direction?: "up" | "down" | "left" | "right";
  amplitude?: number;  // 最大位移 px
}> = ({
  children,
  depth = 0.5,
  direction = "up",
  amplitude = 40,
}) => {
  const frame = useCurrentFrame();
  const offset = Math.sin(frame * 0.015) * amplitude * depth;

  let transform = "";
  if (direction === "up") transform = `translateY(${-offset}px) scale(${1 + depth * 0.05})`;
  else if (direction === "down") transform = `translateY(${offset}px) scale(${1 + depth * 0.05})`;
  else if (direction === "left") transform = `translateX(${-offset}px) scale(${1 + depth * 0.05})`;
  else if (direction === "right") transform = `translateX(${offset}px) scale(${1 + depth * 0.05})`;

  return (
    <div style={{transform, transformOrigin: "center"}}>
      {children}
    </div>
  );
};

/* ────────────────────── TypewriterLine ────────────────────── */
/** 逐字打字机效果：用于 code 场景的终端打字，光标闪烁。
 *  HyperFrames code 模板的核心动效。 */
export const TypewriterLine: React.FC<{
  text: string;
  delay?: number;
  charsPerFrame?: number;  // 每帧打字数（2 = 每2帧1字）
  showCursor?: boolean;
  cursorBlinkSpeed?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  charsPerFrame = 2,
  showCursor = true,
  cursorBlinkSpeed = 0.3,
  color = "#00FF88",
  fontSize = 36,
  fontFamily = "monospace",
  style,
}) => {
  const frame = useCurrentFrame();
  const charsToShow = Math.max(0, Math.floor((frame - delay) / charsPerFrame));
  const visible = text.slice(0, charsToShow);
  const done = charsToShow >= text.length;
  const cursorVisible = done ? Math.sin(frame * cursorBlinkSpeed) > 0 : true;

  return (
    <div
      style={{
        display: "inline-block",
        color,
        fontSize,
        fontFamily,
        ...style,
      }}
    >
      <span>{visible}</span>
      {showCursor && cursorVisible && (
        <span
          style={{
            display: "inline-block",
            width: fontSize * 0.6,
            height: fontSize,
            backgroundColor: color,
            marginLeft: 4,
            verticalAlign: "middle",
            boxShadow: `0 0 ${fontSize * 0.5}px ${color}`,
          }}
        />
      )}
    </div>
  );
};

/* ────────────────────── GlitchBar ────────────────────── */
/** 周期性故障条：横向扫描线故障，整屏偶发闪烁。
 *  HyperFrames 暗黑段的标志性"信号干扰"动效。 */
export const GlitchBar: React.FC<{
  delay?: number;
  interval?: number;    // 故障间隔帧数
  duration?: number;     // 单次故障持续帧数
  color?: string;
  maxBars?: number;
}> = ({
  delay = 0,
  interval = 90,
  duration = 8,
  color = "rgba(255,45,85,0.6)",
  maxBars = 3,
}) => {
  const frame = useCurrentFrame();
  const cycleIndex = Math.floor((frame - delay) / interval);
  const cycleStart = delay + cycleIndex * interval;
  const inCycle = frame >= cycleStart && frame <= cycleStart + duration;

  if (!inCycle) return null;

  const t = frame - cycleStart;
  const rng = mulberry32(cycleIndex * 777);
  const bars = Array.from({length: maxBars}, (_, i) => {
    const y = rng() * 100;
    const h = 2 + rng() * 8;
    const shift = (rng() - 0.5) * 40 * (1 - t / duration);
    const opacity = (1 - t / duration) * (0.4 + rng() * 0.5);
    return {y, h, shift, opacity};
  });

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", mixBlendMode: "screen"}}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${b.y}%`,
            height: b.h,
            backgroundColor: color,
            transform: `translateX(${b.shift}px)`,
            opacity: b.opacity,
          }}
        />
      ))}
    </div>
  );
};

/* ────────────────────── ShimmerText ────────────────────── */
/** 闪光文字流过效果：渐变高光从左到右持续流过文字。
 *  HyperFrames 原则：标题不静止，高光持续流动。 */
export const ShimmerText: React.FC<{
  children: React.ReactNode;
  color?: string;
  highlightColor?: string;
  speed?: number;       // 流过速度（每帧百分比）
  width?: number;       // 高光带宽度百分比
  delay?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  color = "#FFFFFF",
  highlightColor = "rgba(255,255,255,0.9)",
  speed = 1.2,
  width = 30,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const cycleLen = 100 / speed;
  const t = Math.max(0, frame - delay);
  const progress = (t % cycleLen) / cycleLen;
  const pos = progress * 200 - 50; // -50 to 150

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        color,
        ...style,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${pos}%`,
            width: `${width}%`,
            background: `linear-gradient(90deg, transparent, ${highlightColor}, transparent)`,
            mixBlendMode: "overlay",
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
};

/* ────────────────────── BreathingGlow ────────────────────── */
/** 呼吸发光：boxShadow/textShadow 强度持续变化。
 *  HyperFrames 原则：发光元素不静止，强度呼吸保持"活气"。 */
export const BreathingGlow: React.FC<{
  children: React.ReactNode;
  color?: string;
  minBlur?: number;
  maxBlur?: number;
  speed?: number;
  type?: "box" | "text";
  delay?: number;
}> = ({
  children,
  color = "#FF2D55",
  minBlur = 10,
  maxBlur = 40,
  speed = 0.06,
  type = "box",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - delay);
  const breath = 0.5 + Math.sin(t * speed) * 0.5; // 0 to 1
  const blur = minBlur + (maxBlur - minBlur) * breath;

  const glowStyle: React.CSSProperties =
    type === "box"
      ? {boxShadow: `0 0 ${blur}px ${color}, 0 0 ${blur * 2}px ${color}80`}
      : {textShadow: `0 0 ${blur * 0.5}px ${color}, 0 0 ${blur}px ${color}`};

  return <div style={glowStyle}>{children}</div>;
};
