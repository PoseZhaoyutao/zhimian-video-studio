import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const FormulaReveal: React.FC<{payload: Record<string, unknown>; accent: string}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tokens = Array.isArray(payload.tokens)
    ? payload.tokens.map(String)
    : ["结论", "=", "条件", "+", "机制", "+", "边界"];
  const underline = interpolate(frame, [16, 76], [0, 1], clamp);

  return (
    <div style={{backgroundColor: COLORS.ink, color: COLORS.paper, borderRadius: 34, padding: "44px 38px 38px", borderTop: `16px solid ${accent}`, boxShadow: "0 18px 0 rgba(21,21,21,0.14)"}}>
      <div style={{fontSize: 30, color: accent, fontWeight: 950, marginBottom: 28}}>MENTAL MODEL</div>
      <div style={{display: "flex", flexWrap: "wrap", gap: 16}}>
        {tokens.map((token, index) => {
          const appear = spring({frame: frame - index * 8, fps, config: {damping: 16, stiffness: 130}});
          const active = frame >= index * 8 + 8 && frame < index * 8 + 26;
          return (
            <span
              key={`${token}-${index}`}
              style={{
                display: "inline-block",
                opacity: Math.max(0, Math.min(1, appear)),
                transform: `translateY(${(1 - appear) * 26}px) scale(${0.92 + Math.min(1, appear) * 0.08})`,
                padding: token.length <= 1 ? "18px 12px" : "18px 24px",
                borderRadius: 22,
                backgroundColor: active ? accent : "rgba(255,253,247,0.12)",
                color: active ? COLORS.paper : COLORS.paper,
                fontSize: token.length <= 1 ? 46 : 40,
                fontWeight: 950,
              }}
            >
              {token}
            </span>
          );
        })}
      </div>
      <div style={{height: 10, backgroundColor: "rgba(255,253,247,0.16)", borderRadius: 999, marginTop: 36, overflow: "hidden"}}>
        <div style={{height: "100%", width: `${underline * 100}%`, backgroundColor: accent}} />
      </div>
    </div>
  );
};
