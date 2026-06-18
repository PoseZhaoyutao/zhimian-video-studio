import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS} from "../design";

export const ProcessDiagram: React.FC<{payload: Record<string, unknown>; accent: string}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const steps = Array.isArray(payload.steps) ? payload.steps.map(String) : ["问题", "原理", "追问", "回答"];
  return (
    <div style={{display: "grid", gap: 24}}>
      {steps.map((step, index) => {
        const progress = spring({frame: frame - index * 8, fps, config: {damping: 18, stiffness: 120}});
        return (
          <div key={`${step}-${index}`} style={{opacity: Math.max(0, progress), transform: `translateX(${(1 - progress) * 80}px)`, display: "grid", gridTemplateColumns: "74px 1fr", alignItems: "center", gap: 26}}>
            <div style={{width: 74, height: 74, borderRadius: "50%", backgroundColor: accent, color: COLORS.paper, display: "grid", placeItems: "center", fontSize: 32, fontWeight: 900}}>{index + 1}</div>
            <div style={{backgroundColor: COLORS.paper, border: `4px solid ${COLORS.ink}`, padding: "24px 30px", fontSize: 40, fontWeight: 800}}>{step}</div>
          </div>
        );
      })}
    </div>
  );
};
