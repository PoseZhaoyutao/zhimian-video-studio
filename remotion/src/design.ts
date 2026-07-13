import {Easing} from "remotion";

/**
 * Premium Cinematic Design System
 *
 * 设计哲学：
 * - 深邃但不死黑 — 背景有色彩倾向，像太空中的深蓝/深紫
 * - 玻璃材质有真实感 — 多层渐变 + 边缘高光 + 内阴影
 * - 排版有冲击力 — 大字号、粗字重、清晰层级
 * - 光效有目的性 — 方向性体积光，不是随机发光
 * - 留白要大胆 — 一个焦点，干净负空间
 */

export const COLORS = {
  // ═══ 深邃空间背景 ═══
  // 不是纯黑，是有色彩倾向的深空
  space: "#080614",        // 主背景 — 带蓝紫倾向的深空
  spaceDeep: "#040210",    // 更深处
  spaceMid: "#0C0A1E",     // 中间层
  spaceLight: "#14102E",   // 浅层
  spaceGlow: "#1A1640",    // 微光层

  // ═══ 主色 — 克制的靛蓝紫 ═══
  primary: "#6C63FF",       // 主色 — 比之前更饱和
  primaryLight: "#8B83FF",  // 主色亮
  primaryDim: "#4A42CC",    // 主色暗
  primaryGlow: "rgba(108,99,255,0.35)",  // 主色辉光

  // ═══ 辅色 — 冷调青 ═══
  accent: "#38BDF8",        // 冷青 — 用于对比/强调
  accentLight: "#7DD3FC",
  accentDim: "#0EA5E9",

  // ═══ 暖色 — 仅用于赢家/重点 ═══
  warm: "#F59E0B",          // 琥珀 — 极少量使用
  warmLight: "#FCD34D",
  warmGlow: "rgba(245,158,11,0.3)",

  // ═══ 文字层级 ═══
  textPrimary: "#F1F0FF",   // 主文字 — 带微紫的白
  textSecondary: "#A5A3C8", // 副文字
  textMuted: "#6B6990",     // 弱文字
  textOnGlass: "#E8E6FF",   // 玻璃上的文字

  // ═══ 玻璃材质 ═══
  glass: {
    bg: "rgba(16,14,40,0.65)",
    bgLight: "rgba(24,20,56,0.55)",
    border: "rgba(108,99,255,0.22)",
    borderActive: "rgba(108,99,255,0.5)",
    highlight: "rgba(255,255,255,0.08)",
    shadow: "rgba(0,0,0,0.5)",
    innerGlow: "rgba(108,99,255,0.06)",
  },

  // ═══ 体积光 ═══
  volLight: {
    core: "rgba(108,99,255,0.4)",
    mid: "rgba(108,99,255,0.15)",
    edge: "rgba(56,189,248,0.05)",
    warm: "rgba(245,158,11,0.12)",
  },

  // ═══ 保留兼容 ═══
  premiumBg: "#080614",
  premiumBgMid: "#0C0A1E",
  premiumIndigo: "#6C63FF",
  premiumIndigoLight: "#8B83FF",
  premiumPurple: "#A855F7",
  premiumPurpleLight: "#C4B5FD",
  premiumText: "#F1F0FF",
  premiumMuted: "#6B6990",
  premiumBorder: "rgba(108,99,255,0.22)",
  premiumProgressBg: "rgba(108,99,255,0.12)",
  glassBg: "rgba(16,14,40,0.65)",
  glassBorder: "rgba(108,99,255,0.22)",
  glassHighlight: "rgba(255,255,255,0.08)",
  cream: "#F4EFE4",
  ink: "#151515",
  interview: "#E83F32",
  ai: "#265CFF",
  muted: "#817B72",
  paper: "#FFFDF7",
  refDarkBg: "#121212",
  refDarkSurface: "#1A1A1A",
  refCardBg: "#FFF8EE",
  refCardBorder: "#265CFF",
  refRed: "#E63946",
  refBlue: "#265CFF",
  refRedBar: "#E63946",
  refBlueBar: "#265CFF",
  refDarkText: "#FFFFFF",
  refMutedText: "#777777",
  refEyebrowText: "#999999",
  refPaperBarBg: "#2A1515",
  refPaperBarText: "#E8C4C4",
  refProgressBg: "rgba(255,255,255,0.15)",
  refProgressFill: "#265CFF",
  darkBg: "#0A0A0F",
  darkSurface: "#14141C",
  darkSurfaceAlt: "#1E1E2A",
  neonRed: "#FF2D55",
  neonBlue: "#00D4FF",
  neonAmber: "#FFB300",
  neonWhite: "#F5F5FA",
} as const;

export const SAFE_MARGIN_X = 80;
export const SAFE_MARGIN_TOP = 100;
export const SAFE_MARGIN_BOTTOM = 240;
export const FONT_FAMILY = '"Microsoft YaHei", "PingFang SC", "SF Pro Display", Arial, sans-serif';
export const MONO_FAMILY = '"Cascadia Code", "SF Mono", "Consolas", monospace';

export const categoryColor = (column: string) =>
  column.includes("AI") ? COLORS.primary : COLORS.premiumPurple;

// ═══ 电影级缓动 ═══
export const EASE = {
  // 标准缓入缓出 — 大部分动画
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  // 强缓入缓出 — 重要转场
  dramatic: Easing.bezier(0.65, 0, 0.35, 1),
  // 柔和正弦 — 呼吸/浮动
  gentle: Easing.sin,
  // 弹性出 — 入场
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
  // 惯性出 — 减速停止
  inertial: Easing.bezier(0.16, 1, 0.3, 1),
  // 兼容旧名
  power3InOut: Easing.bezier(0.65, 0, 0.35, 1),
  power2InOut: Easing.bezier(0.45, 0, 0.55, 1),
  sineInOut: Easing.sin,
  power2Out: Easing.bezier(0.33, 0, 0.55, 1),
  inertialOut: Easing.bezier(0.16, 1, 0.3, 1),
  inertialInOut: Easing.bezier(0.84, 0, 0.16, 1),
};

/**
 * 高级玻璃材质 — 真实玻璃感
 * 多层渐变 + 边缘高光 + 内阴影
 */
export const glassStyle = (opacity = 0.65): React.CSSProperties => ({
  background: `linear-gradient(
    135deg,
    rgba(20,16,46,${opacity}) 0%,
    rgba(14,12,36,${opacity * 0.85}) 50%,
    rgba(20,16,46,${opacity * 0.9}) 100%
  )`,
  border: `1px solid ${COLORS.glass.border}`,
  borderRadius: 20,
  boxShadow: `
    0 20px 60px rgba(0,0,0,0.5),
    0 8px 24px rgba(0,0,0,0.3),
    inset 0 1px 0 ${COLORS.glass.highlight},
    inset 0 -1px 0 rgba(0,0,0,0.2)
  `,
});

/**
 * 激活态玻璃 — 用于赢家卡片/焦点元素
 */
export const glassActiveStyle = (): React.CSSProperties => ({
  background: `linear-gradient(
    135deg,
    rgba(108,99,255,0.15) 0%,
    rgba(20,16,46,0.7) 50%,
    rgba(108,99,255,0.1) 100%
  )`,
  border: `1.5px solid ${COLORS.glass.borderActive}`,
  borderRadius: 20,
  boxShadow: `
    0 20px 60px rgba(0,0,0,0.5),
    0 0 40px ${COLORS.primaryGlow},
    inset 0 1px 0 ${COLORS.glass.highlight},
    inset 0 -1px 0 rgba(0,0,0,0.2)
  `,
});

export const sceneTheme = (visualType: string, sceneId?: string): "dark" | "cream" | "ref" => {
  return "ref";
};
