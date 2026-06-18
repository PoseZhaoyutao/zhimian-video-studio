import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const ComparisonPanel: React.FC<{payload: Record<string, unknown>; accent: string}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const left = String(payload.left ?? "普通回答");
  const right = String(payload.right ?? "高分回答");
  const winner = String(payload.winner ?? "right");
  const leftIn = spring({frame: frame - 4, fps, config: {damping: 18, stiffness: 120}});
  const rightIn = spring({frame: frame - 14, fps, config: {damping: 18, stiffness: 120}});
  const scan = interpolate(frame, [20, 58], [0, 1], clamp);

  return (
    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 8}}>
      <Card
        title="低分区"
        text={left}
        accent={COLORS.muted}
        scale={leftIn}
        marker={winner === "left" ? "✓" : "×"}
        bar={winner === "left" ? scan : 0.35 * scan}
      />
      <Card
        title="高分区"
        text={right}
        accent={accent}
        scale={rightIn}
        marker={winner === "right" ? "✓" : "×"}
        bar={winner === "right" ? scan : 0.35 * scan}
      />
    </div>
  );
};

const Card: React.FC<{
  title: string;
  text: string;
  accent: string;
  scale: number;
  marker: string;
  bar: number;
}> = ({title, text, accent, scale, marker, bar}) => (
  <div
    style={{
      minHeight: 360,
      backgroundColor: COLORS.paper,
      border: `5px solid ${COLORS.ink}`,
      borderRadius: 34,
      padding: 32,
      transform: `scale(${0.86 + Math.max(0, Math.min(1, scale)) * 0.14})`,
      opacity: Math.max(0, Math.min(1, scale)),
      boxShadow: "0 18px 0 rgba(21,21,21,0.14)",
      display: "grid",
      alignContent: "space-between",
    }}
  >
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
      <div style={{fontSize: 28, color: accent, fontWeight: 950}}>{title}</div>
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 999,
          backgroundColor: accent,
          color: COLORS.paper,
          display: "grid",
          placeItems: "center",
          fontSize: 36,
          fontWeight: 950,
        }}
      >
        {marker}
      </div>
    </div>
    <div style={{fontSize: 48, lineHeight: 1.15, fontWeight: 950}}>{text}</div>
    <div style={{height: 12, backgroundColor: "rgba(21,21,21,0.12)", borderRadius: 999, overflow: "hidden"}}>
      <div style={{height: "100%", width: `${Math.max(0, Math.min(1, bar)) * 100}%`, backgroundColor: accent}} />
    </div>
  </div>
);
