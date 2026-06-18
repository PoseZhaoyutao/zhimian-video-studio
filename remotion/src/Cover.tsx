import {fitText} from "@remotion/layout-utils";
import {AbsoluteFill} from "remotion";
import {categoryColor, COLORS, FONT_FAMILY, SAFE_MARGIN_X} from "./design";
import type {VideoProps} from "./types";

export const Cover: React.FC<VideoProps> = ({title, column, episode, benefit}) => {
  const accent = categoryColor(column);
  const fitted = fitText({
    text: title,
    withinWidth: 1080 - SAFE_MARGIN_X * 2,
    fontFamily: FONT_FAMILY,
    fontWeight: 900,
  });
  const fontSize = Math.min(126, fitted.fontSize);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.cream,
        color: COLORS.ink,
        fontFamily: FONT_FAMILY,
        padding: `${96}px ${SAFE_MARGIN_X}px`,
      }}
    >
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{backgroundColor: COLORS.ink, color: COLORS.paper, padding: "16px 24px", borderRadius: 999, fontSize: 34, fontWeight: 800}}>
          {column}
        </div>
        <div style={{fontSize: 32, fontWeight: 900, letterSpacing: 3}}>{episode}</div>
      </div>
      <div style={{height: 220}} />
      <div style={{width: 160, height: 18, backgroundColor: accent, marginBottom: 40}} />
      <div style={{fontSize, fontWeight: 950, lineHeight: 1.05, letterSpacing: -5, whiteSpace: "pre-wrap"}}>
        {title}
      </div>
      <div style={{marginTop: 60, fontSize: 40, lineHeight: 1.45, fontWeight: 700, maxWidth: 850}}>
        {benefit}
      </div>
      <div style={{marginTop: "auto", display: "flex", alignItems: "end", gap: 20}}>
        <div style={{width: 260, height: 260, backgroundColor: accent, transform: "rotate(12deg)"}} />
        <div style={{width: 120, height: 120, border: `18px solid ${COLORS.ink}`, borderRadius: "50%"}} />
        <div style={{fontSize: 32, fontWeight: 900, marginLeft: "auto"}}>智面引擎 · 每日一题</div>
      </div>
    </AbsoluteFill>
  );
};
