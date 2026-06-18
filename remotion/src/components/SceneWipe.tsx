import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const SceneWipe: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const panelX = interpolate(frame, [0, 5, 20], [0, 0, 1160], clamp);
  const stripeX = interpolate(frame, [0, 8, 24], [-180, -180, 1240], clamp);
  const labelOpacity = interpolate(frame, [0, 4, 12, 18], [0, 1, 1, 0], clamp);
  const labelX = interpolate(frame, [0, 12], [-36, 24], clamp);

  if (frame > 24) {
    return null;
  }

  return (
    <AbsoluteFill style={{pointerEvents: "none", zIndex: 40, overflow: "hidden"}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: accent,
          transform: `translateX(${panelX}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 180,
          backgroundColor: COLORS.ink,
          transform: `translateX(${stripeX}px) skewX(-8deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 90,
          bottom: 190,
          color: COLORS.paper,
          fontSize: 34,
          fontWeight: 950,
          letterSpacing: 6,
          opacity: labelOpacity,
          transform: `translateX(${labelX}px)`,
        }}
      >
        ZHIMIAN / NEXT
      </div>
    </AbsoluteFill>
  );
};
