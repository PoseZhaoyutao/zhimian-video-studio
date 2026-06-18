import type {Caption} from "@remotion/captions";
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {categoryColor, COLORS, FONT_FAMILY, SAFE_MARGIN_X} from "../design";

const CaptionCard: React.FC<{caption: Caption; accent: string}> = ({caption, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 15, stiffness: 170, mass: 0.7}});
  const underline = interpolate(frame, [5, 20], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{justifyContent: "flex-end", alignItems: "center", padding: `0 ${SAFE_MARGIN_X}px 180px`, pointerEvents: "none"}}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          opacity: Math.max(0, Math.min(1, enter)),
          transform: `translateY(${(1 - enter) * 36}px) scale(${0.96 + enter * 0.04})`,
          backgroundColor: COLORS.ink,
          color: COLORS.paper,
          borderLeft: `14px solid ${accent}`,
          padding: "22px 30px 28px",
          borderRadius: 18,
          fontFamily: FONT_FAMILY,
          fontSize: 46,
          fontWeight: 800,
          lineHeight: 1.35,
          textAlign: "center",
          maxWidth: 920,
          whiteSpace: "pre-wrap",
          boxShadow: "0 14px 0 rgba(21,21,21,0.12)",
        }}
      >
        <span style={{position: "relative", zIndex: 2}}>{caption.text.trim()}</span>
        <div
          style={{
            position: "absolute",
            left: 26,
            right: 26,
            bottom: 12,
            height: 6,
            borderRadius: 999,
            backgroundColor: accent,
            transformOrigin: "left center",
            transform: `scaleX(${underline})`,
            opacity: 0.85,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const CaptionLayer: React.FC<{captions: Caption[]; column: string}> = ({captions, column}) => {
  const {fps} = useVideoConfig();
  const accent = categoryColor(column);
  return (
    <AbsoluteFill>
      {captions.map((caption, index) => {
        const from = Math.round((caption.startMs / 1000) * fps);
        const durationInFrames = Math.max(1, Math.round(((caption.endMs - caption.startMs) / 1000) * fps));
        return (
          <Sequence key={`${caption.startMs}-${index}`} from={from} durationInFrames={durationInFrames} premountFor={fps}>
            <CaptionCard caption={caption} accent={accent} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
