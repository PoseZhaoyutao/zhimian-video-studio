import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONT_FAMILY} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const SceneImage: React.FC<{
  imageFile: string;
  imageAlt: string;
  accent: string;
}> = ({imageFile, imageAlt, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: frame - 8, fps, config: {damping: 18, stiffness: 110}});
  const reveal = interpolate(frame, [6, 30], [0, 100], clamp);
  const drift = interpolate(frame, [0, fps * 8], [-2.5, 2.5], clamp);
  const zoom = interpolate(frame, [0, fps * 8], [1.08, 1.16], clamp);

  return (
    <div
      style={{
        position: "relative",
        height: 460,
        overflow: "hidden",
        border: `5px solid ${COLORS.ink}`,
        borderRadius: 36,
        backgroundColor: COLORS.paper,
        boxShadow: "0 18px 0 rgba(21,21,21,0.14)",
        opacity: Math.max(0, Math.min(1, enter)),
        transform: `translateY(${(1 - enter) * 42}px) rotate(${(1 - enter) * -1.2}deg)`,
        clipPath: `inset(0 ${100 - reveal}% 0 0 round 30px)`,
      }}
    >
      <Img
        src={staticFile(imageFile)}
        alt={imageAlt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 35%",
          transform: `translateX(${drift}%) scale(${zoom})`,
          filter: "saturate(0.92) contrast(1.04)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 22,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          backgroundColor: "rgba(21,21,21,0.82)",
          color: COLORS.paper,
          borderLeft: `10px solid ${accent}`,
          fontFamily: FONT_FAMILY,
          fontSize: 25,
          fontWeight: 850,
          lineHeight: 1.2,
        }}
      >
        <span style={{color: accent}}>AI VISUAL</span>
        <span>{imageAlt}</span>
      </div>
    </div>
  );
};
