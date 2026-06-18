import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONT_FAMILY} from "../design";

export const CodeCard: React.FC<{payload: Record<string, unknown>; accent: string}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [8, 20], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const code = String(payload.code ?? "# 用可验证的步骤回答技术问题");
  return (
    <div style={{opacity, backgroundColor: COLORS.ink, color: COLORS.paper, borderTop: `14px solid ${accent}`, borderRadius: 24, padding: 38, fontFamily: '"Cascadia Code", monospace', fontSize: 36, lineHeight: 1.55, whiteSpace: "pre-wrap"}}>
      <div style={{fontFamily: FONT_FAMILY, color: accent, fontWeight: 900, marginBottom: 20}}>TECH NOTE</div>
      {code}
    </div>
  );
};
