export type StyleId = "dark-neon" | "cream-editorial" | "ref-comparison" | "tech-glow";

export interface Style {
  id: StyleId;
  name: string;
  description: string;
  bgGradient: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  glowIntensity: string;
}

export interface Scene {
  id: string;
  title: string;
  subtitle: string;
  visualType: "comparison" | "flow" | "formula" | "code" | "process";
  leftLabel?: string;
  rightLabel?: string;
  winner?: "left" | "right";
  steps?: string[];
  tokens?: string[];
  code?: string;
}

export interface SceneStyleChoice {
  sceneId: string;
  styleId: StyleId;
}
