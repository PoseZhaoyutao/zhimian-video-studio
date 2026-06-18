import {interpolate, useCurrentFrame} from "remotion";
import {COLORS} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const LABELS: Record<string, string> = {
  code: "BUILD",
  comparison: "CHOOSE",
  flow: "FLOW",
  formula: "MODEL",
  process: "STEPS",
  editorial: "IDEA",
};

export const MotionBackdrop: React.FC<{accent: string; variant?: string}> = ({accent, variant = "editorial"}) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame % 180, [0, 180], [-320, 1260], clamp);
  const drift = Math.sin(frame / 30) * 34;
  const orbit = frame * 0.42;
  const rail = interpolate(frame, [8, 42], [0, 1], clamp);
  const label = LABELS[variant] ?? "MOTION";

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: -80,
          top: 170 + drift,
          fontSize: 250,
          lineHeight: 0.9,
          fontWeight: 950,
          letterSpacing: -16,
          color: COLORS.ink,
          opacity: 0.025,
          transform: `rotate(-90deg) translateX(${Math.sin(frame / 50) * 24}px)`,
          transformOrigin: "center",
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: 185,
          width: 250,
          height: 250,
          borderRadius: "42% 58% 64% 36%",
          backgroundColor: accent,
          opacity: 0.11,
          transform: `rotate(${frame * 0.18}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -155 + Math.sin(frame / 28) * 38,
          top: 520,
          width: 430,
          height: 430,
          borderRadius: 999,
          border: `4px solid ${accent}`,
          opacity: 0.08 + Math.sin(frame / 14) * 0.025,
          transform: `rotate(${orbit}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -14,
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: accent,
            transform: "translateX(-50%)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 190,
          height: 4,
          backgroundColor: COLORS.ink,
          opacity: 0.08,
          transformOrigin: "left center",
          transform: `scaleX(${rail})`,
        }}
      />
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: 88 + index * 210,
            top: 1380 + Math.sin(frame / (16 + index * 2) + index) * (12 + index * 2),
            width: index === 2 ? 42 : 12 + index * 2,
            height: index === 2 ? 6 : 12 + index * 2,
            borderRadius: index === 2 ? 4 : 999,
            backgroundColor: index % 2 === 0 ? accent : COLORS.ink,
            opacity: 0.12 + index * 0.018,
            transform: `rotate(${index * 17 + frame * (index % 2 === 0 ? 0.1 : -0.08)}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: -120,
          bottom: 150,
          width: 680,
          height: 150,
          borderTop: `2px solid ${accent}`,
          borderRadius: "50%",
          opacity: 0.1,
          transform: `rotate(${-7 + Math.sin(frame / 40) * 2}deg)`,
        }}
      />
    </div>
  );
};
