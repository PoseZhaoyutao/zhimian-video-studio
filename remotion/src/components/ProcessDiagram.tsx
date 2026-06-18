import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS} from "../design";

export const ProcessDiagram: React.FC<{payload: Record<string, unknown>; accent: string}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const steps = Array.isArray(payload.steps) ? payload.steps.map(String) : ["问题", "原理", "追问", "回答"];
  const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
  const lineProgress = interpolate(frame, [8, 52], [0, 1], clamp);
  return (
    <div style={{position: "relative", display: "grid", gap: 24}}>
      <div
        style={{
          position: "absolute",
          top: 38,
          bottom: 38,
          left: 35,
          width: 6,
          backgroundColor: accent,
          transformOrigin: "top center",
          transform: `scaleY(${lineProgress})`,
          opacity: 0.35,
        }}
      />
      {steps.map((step, index) => {
        const progress = spring({frame: frame - index * 9, fps, config: {damping: 16, stiffness: 145, mass: 0.75}});
        const active = interpolate(frame, [index * 16 + 8, index * 16 + 24, index * 16 + 42], [0, 1, 0.25], clamp);
        return (
          <div key={`${step}-${index}`} style={{position: "relative", opacity: Math.max(0, progress), transform: `translateX(${(1 - progress) * (index % 2 === 0 ? -86 : 86)}px)`, display: "grid", gridTemplateColumns: "74px 1fr", alignItems: "center", gap: 26}}>
            <div style={{position: "relative", zIndex: 2, width: 74, height: 74, borderRadius: "50%", backgroundColor: accent, color: COLORS.paper, display: "grid", placeItems: "center", fontSize: 32, fontWeight: 900, boxShadow: `0 0 0 ${active * 16}px ${accent}22`}}>{index + 1}</div>
            <div style={{backgroundColor: COLORS.paper, border: `4px solid ${COLORS.ink}`, padding: "24px 30px", fontSize: 40, fontWeight: 800, transform: `rotate(${(1 - progress) * (index % 2 === 0 ? -1.5 : 1.5)}deg)`, boxShadow: "0 12px 0 rgba(21,21,21,0.1)"}}>{step}</div>
          </div>
        );
      })}
    </div>
  );
};
