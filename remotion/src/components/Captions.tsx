import type {Caption} from "@remotion/captions";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {categoryColor, COLORS, FONT_FAMILY, SAFE_MARGIN_X} from "../design";

const CaptionCard: React.FC<{caption: Caption; accent: string}> = ({caption, accent}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{justifyContent: "flex-end", alignItems: "center", padding: `0 ${SAFE_MARGIN_X}px 180px`, pointerEvents: "none"}}>
      <div style={{opacity, backgroundColor: COLORS.ink, color: COLORS.paper, borderLeft: `14px solid ${accent}`, padding: "22px 30px", borderRadius: 18, fontFamily: FONT_FAMILY, fontSize: 46, fontWeight: 800, lineHeight: 1.35, textAlign: "center", maxWidth: 920, whiteSpace: "pre-wrap"}}>
        {caption.text.trim()}
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
