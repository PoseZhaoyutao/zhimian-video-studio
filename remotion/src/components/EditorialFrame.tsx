import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {categoryColor, COLORS, FONT_FAMILY, SAFE_MARGIN_BOTTOM, SAFE_MARGIN_TOP, SAFE_MARGIN_X} from "../design";
import type {Scene} from "../types";
import {CodeCard} from "./CodeCard";
import {ComparisonPanel} from "./ComparisonPanel";
import {FlowDiagram} from "./FlowDiagram";
import {FormulaReveal} from "./FormulaReveal";
import {KineticHeadline} from "./KineticHeadline";
import {MotionBackdrop} from "./MotionBackdrop";
import {ProcessDiagram} from "./ProcessDiagram";
import {SceneImage} from "./SceneImage";

export const EditorialFrame: React.FC<{scene: Scene; column: string; title: string}> = ({scene, column, title}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const accent = categoryColor(column);
  const entry = spring({frame, fps, config: {damping: 18, stiffness: 130}});
  const headerEntry = spring({frame: frame - 8, fps, config: {damping: 16, stiffness: 160}});
  const opacity = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.cream, color: COLORS.ink, fontFamily: FONT_FAMILY}}>
      <MotionBackdrop accent={accent} variant={scene.visualType} />
      <div
        style={{
          position: "absolute",
          top: SAFE_MARGIN_TOP,
          left: SAFE_MARGIN_X,
          right: SAFE_MARGIN_X,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 30,
          fontWeight: 800,
          opacity: Math.max(0, Math.min(1, headerEntry)),
          transform: `translateY(${(1 - headerEntry) * -36}px)`,
        }}
      >
        <span style={{color: accent}}>{column}</span>
        <span style={{color: COLORS.muted}}>智面引擎</span>
      </div>
      <div style={{position: "absolute", top: 250, left: SAFE_MARGIN_X, right: SAFE_MARGIN_X, bottom: SAFE_MARGIN_BOTTOM, opacity, transform: `translateY(${(1 - entry) * 70}px)`}}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            fontSize: 38,
            color: COLORS.muted,
            marginBottom: 22,
            opacity: Math.max(0, Math.min(1, headerEntry)),
            transform: `translateX(${(1 - headerEntry) * 44}px)`,
          }}
        >
          <span style={{display: "inline-block", width: 44, height: 8, borderRadius: 999, backgroundColor: accent}} />
          {title}
        </div>
        <KineticHeadline text={scene.onScreenText} accent={accent} />
        {scene.imageFile ? (
          <div style={{marginTop: 44}}>
            <SceneImage imageFile={scene.imageFile} imageAlt={scene.imageAlt ?? "AI generated scene visual"} accent={accent} />
          </div>
        ) : null}
        <div style={{marginTop: scene.imageFile ? 38 : 70}}>
          {scene.visualType === "code" ? <CodeCard payload={scene.visualPayload} accent={accent} /> : null}
          {scene.visualType === "process" ? <ProcessDiagram payload={scene.visualPayload} accent={accent} /> : null}
          {scene.visualType === "flow" ? <FlowDiagram payload={scene.visualPayload} accent={accent} /> : null}
          {scene.visualType === "comparison" ? <ComparisonPanel payload={scene.visualPayload} accent={accent} /> : null}
          {scene.visualType === "formula" ? <FormulaReveal payload={scene.visualPayload} accent={accent} /> : null}
          {scene.visualType === "editorial" ? <div style={{height: 16, width: `${Math.min(100, 20 + frame)}%`, backgroundColor: accent, marginTop: 70}} /> : null}
        </div>
      </div>
      <div style={{position: "absolute", left: SAFE_MARGIN_X, right: SAFE_MARGIN_X, bottom: 110, height: 8, backgroundColor: "rgba(21,21,21,0.12)"}}>
        <div style={{height: "100%", width: `${Math.min(100, (frame / scene.durationInFrames) * 100)}%`, backgroundColor: accent}} />
      </div>
    </AbsoluteFill>
  );
};
