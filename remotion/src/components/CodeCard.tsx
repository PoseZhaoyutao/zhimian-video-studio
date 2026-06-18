import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONT_FAMILY} from "../design";

export const CodeCard: React.FC<{payload: Record<string, unknown>; accent: string}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
  const opacity = interpolate(frame, [8, 20], [0, 1], clamp);
  const scan = interpolate(frame % 90, [0, 90], [-20, 110], clamp);
  const code = String(payload.code ?? "# 用可验证的步骤回答技术问题");
  const lines = code.split("\n");
  return (
    <div style={{position: "relative", overflow: "hidden", opacity, backgroundColor: COLORS.ink, color: COLORS.paper, borderTop: `14px solid ${accent}`, borderRadius: 24, padding: 38, fontFamily: '"Cascadia Code", monospace', fontSize: 36, lineHeight: 1.55, whiteSpace: "pre-wrap", boxShadow: "0 22px 0 rgba(21,21,21,0.14)"}}>
      <div style={{fontFamily: FONT_FAMILY, color: accent, fontWeight: 900, marginBottom: 20, display: "flex", alignItems: "center", gap: 16}}>
        <span style={{width: 14, height: 14, borderRadius: 999, backgroundColor: accent, boxShadow: `0 0 0 8px ${accent}24`}} />
        TECH NOTE
      </div>
      {lines.map((line, index) => {
        const progress = interpolate(frame, [14 + index * 9, 30 + index * 9], [0, 1], clamp);
        const visibleCharacters = Math.ceil(line.length * progress);
        const cursorVisible = index === lines.length - 1 && Math.floor(frame / 7) % 2 === 0;
        return (
          <div key={`${line}-${index}`} style={{minHeight: 56, opacity: progress, transform: `translateX(${(1 - progress) * 34}px)`}}>
            <span style={{color: accent, marginRight: 16}}>{String(index + 1).padStart(2, "0")}</span>
            {line.slice(0, visibleCharacters)}
            {cursorVisible && progress > 0.85 ? <span style={{display: "inline-block", width: 14, height: 38, marginLeft: 6, backgroundColor: accent, verticalAlign: "middle"}} /> : null}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${scan}%`,
          width: 90,
          backgroundColor: accent,
          opacity: 0.06,
          transform: "skewX(-12deg)",
        }}
      />
    </div>
  );
};
