export const COLORS = {
  cream: "#F4EFE4",
  ink: "#151515",
  interview: "#E83F32",
  ai: "#265CFF",
  muted: "#817B72",
  paper: "#FFFDF7",
} as const;

export const SAFE_MARGIN_X = 72;
export const SAFE_MARGIN_TOP = 96;
export const SAFE_MARGIN_BOTTOM = 230;
export const FONT_FAMILY = '"Microsoft YaHei", "PingFang SC", Arial, sans-serif';

export const categoryColor = (column: string) =>
  column.includes("AI") ? COLORS.ai : COLORS.interview;
