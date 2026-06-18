import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const BURST_ANGLES = [-78, -48, -18, 18, 48, 78];

export const KineticHeadline: React.FC<{text: string; accent: string}> = ({text, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: frame - 5, fps, config: {damping: 15, stiffness: 150, mass: 0.8}});
  const reveal = interpolate(frame, [4, 20], [0, 100], clamp);
  const marker = interpolate(frame, [18, 34], [0, 1], clamp);
  const burst = spring({frame: frame - 22, fps, config: {damping: 12, stiffness: 190, mass: 0.55}});

  return (
    <div style={{position: "relative", paddingBottom: 26}}>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          fontSize: 94,
          lineHeight: 1.08,
          fontWeight: 950,
          letterSpacing: -4,
          opacity: Math.max(0, Math.min(1, enter)),
          transform: `translateX(${(1 - enter) * -72}px) rotate(${(1 - enter) * -1.2}deg)`,
          clipPath: `inset(0 ${100 - reveal}% 0 0)`,
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "absolute",
          left: -10,
          bottom: 10,
          width: "74%",
          height: 22,
          backgroundColor: accent,
          opacity: 0.24,
          transformOrigin: "left center",
          transform: `scaleX(${marker}) skewX(-8deg)`,
          zIndex: 1,
        }}
      />
      <div style={{position: "absolute", right: 18, top: -12, width: 120, height: 120, zIndex: 3}}>
        {BURST_ANGLES.map((angle, index) => (
          <div
            key={angle}
            style={{
              position: "absolute",
              left: 58,
              top: 58,
              width: 5,
              height: 34 + (index % 3) * 9,
              borderRadius: 999,
              backgroundColor: index % 2 === 0 ? accent : COLORS.ink,
              transformOrigin: "center bottom",
              transform: `rotate(${angle}deg) translateY(-42px) scaleY(${Math.max(0, burst)})`,
              opacity: Math.max(0, Math.min(1, burst)),
            }}
          />
        ))}
      </div>
    </div>
  );
};
