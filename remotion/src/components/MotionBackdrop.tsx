import {interpolate, useCurrentFrame} from "remotion";
import {COLORS} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const MotionBackdrop: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame % 150, [0, 150], [-220, 1120], clamp);
  const pulse = 0.08 + Math.sin(frame / 14) * 0.025;

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: 210,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: accent,
          opacity: 0.12,
          filter: "blur(1px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -120 + Math.sin(frame / 28) * 28,
          top: 560,
          width: 360,
          height: 360,
          borderRadius: 999,
          border: `4px solid ${accent}`,
          opacity: pulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 56,
          bottom: 260,
          width: 240,
          height: 240,
          borderRadius: 48,
          border: `3px solid ${COLORS.ink}`,
          opacity: 0.05,
          transform: `rotate(${frame * 0.08}deg)`,
        }}
      />
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: 110 + index * 220,
            top: 1420 + Math.sin(frame / 18 + index) * 16,
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: index % 2 === 0 ? accent : COLORS.ink,
            opacity: 0.16,
          }}
        />
      ))}
    </div>
  );
};
