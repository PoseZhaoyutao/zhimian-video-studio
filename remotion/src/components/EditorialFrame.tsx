import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {
  COLORS,
  EASE,
  FONT_FAMILY,
  glassStyle,
  SAFE_MARGIN_BOTTOM,
  SAFE_MARGIN_TOP,
  SAFE_MARGIN_X,
} from "../design";
import type {Scene} from "../types";
import {CodeCard} from "./CodeCard";
import {ComparisonPanel} from "./ComparisonPanel";
import {FlowDiagram} from "./FlowDiagram";
import {FormulaMorph} from "./FormulaMorph";
import {FormulaReveal} from "./FormulaReveal";
import {KineticHeadline} from "./KineticHeadline";
import {MotionBackdrop} from "./MotionBackdrop";
import {NodeGraph} from "./NodeGraph";
import {PathFlowDiagram} from "./PathFlowDiagram";
import {ProcessDiagram} from "./ProcessDiagram";
import {RingTopology} from "./RingTopology";
import {SceneImage} from "./SceneImage";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/**
 * 电影级场景容器 — 强视觉层次，大留白
 *
 * 设计哲学：
 * - 一个焦点，干净负空间
 * - 排版有冲击力
 * - 镜头缓慢推近，营造沉浸感
 */
export const EditorialFrame: React.FC<{scene: Scene; column: string; title: string}> = ({scene, column, title}) => {
  const frame = useCurrentFrame();

  // 镜头缓慢推近 — scale 0.97 → 1.0
  const camScale = interpolate(frame, [0, 90], [0.97, 1.0], {
    ...clamp,
    easing: EASE.inertial,
  });

  // Brand bar 入场
  const headerEnter = interpolate(frame, [0, 35], [0, 1], {...clamp, easing: EASE.dramatic});
  const headerY = (1 - headerEnter) * -24;

  // Body content 入场
  const bodyEnter = interpolate(frame, [10, 55], [0, 1], {...clamp, easing: EASE.inertial});
  const bodyY = (1 - bodyEnter) * 50;

  // Eyebrow 入场
  const eyebrowEnter = interpolate(frame, [8, 40], [0, 1], {...clamp, easing: EASE.standard});
  const eyebrowX = (1 - eyebrowEnter) * 35;

  // 呼吸
  const breathe = Math.sin(frame / 100) * 2.5;

  // 进度
  const progress = Math.min(100, (frame / scene.durationInFrames) * 100);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.space,
        color: COLORS.textPrimary,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${camScale})`,
          transformOrigin: "center center",
        }}
      >
        <MotionBackdrop accent={COLORS.primary} variant={scene.visualType} theme="ref" />

        {/* 顶部品牌栏 */}
        <div
          style={{
            position: "absolute",
            top: SAFE_MARGIN_TOP,
            left: SAFE_MARGIN_X,
            right: SAFE_MARGIN_X,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: headerEnter,
            transform: `translateY(${headerY}px)`,
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: COLORS.primaryLight,
              letterSpacing: "-0.01em",
            }}
          >
            {column}
          </span>
          <span
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: COLORS.textMuted,
              letterSpacing: "0.02em",
            }}
          >
            智面引擎
          </span>
        </div>

        {/* 主体内容 */}
        <div
          style={{
            position: "absolute",
            top: 260,
            left: SAFE_MARGIN_X,
            right: SAFE_MARGIN_X,
            bottom: SAFE_MARGIN_BOTTOM,
            opacity: bodyEnter,
            transform: `translateY(${bodyY + breathe}px)`,
            zIndex: 2,
          }}
        >
          {/* eyebrow + 大标题 */}
          <div style={{display: "flex", flexDirection: "column", gap: 16, marginBottom: 40}}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                fontSize: 30,
                color: COLORS.textSecondary,
                fontWeight: 600,
                opacity: eyebrowEnter,
                transform: `translateX(${eyebrowX}px)`,
                letterSpacing: "0.01em",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 36,
                  backgroundColor: COLORS.primary,
                  borderRadius: 3,
                  boxShadow: `0 0 12px ${COLORS.primaryGlow}`,
                }}
              />
              {scene.caption ?? title}
            </div>
            <KineticHeadline text={scene.onScreenText} accent={COLORS.primary} theme="ref" />
          </div>

          {/* 场景图片 */}
          {scene.imageFile ? (
            <div style={{marginTop: 40}}>
              <SceneImage
                imageFile={scene.imageFile}
                imageAlt={scene.imageAlt ?? "AI generated scene visual"}
                imageAttribution={scene.imageAttribution}
                imageRole={scene.imageRole}
                accent={COLORS.primary}
              />
            </div>
          ) : null}

          {/* 视觉组件 */}
          <div style={{marginTop: scene.imageFile ? 36 : 20}}>
            {scene.visualType === "code" ? <CodeCard payload={scene.visualPayload as any} accent={COLORS.primary} theme="ref" /> : null}
            {scene.visualType === "process" ? <ProcessDiagram payload={scene.visualPayload as any} accent={COLORS.primary} theme="ref" /> : null}
            {scene.visualType === "flow" ? <FlowDiagram payload={scene.visualPayload as any} accent={COLORS.primary} theme="ref" /> : null}
            {scene.visualType === "comparison" ? <ComparisonPanel payload={scene.visualPayload as any} accent={COLORS.primary} theme="ref" sceneId={scene.id} /> : null}
            {scene.visualType === "formula" ? <FormulaReveal payload={scene.visualPayload as any} accent={COLORS.primary} theme="ref" /> : null}
            {scene.visualType === "ring" ? <RingTopology payload={scene.visualPayload as any} accent={COLORS.primary} /> : null}
            {scene.visualType === "nodegraph" ? <NodeGraph payload={scene.visualPayload as any} accent={COLORS.primary} /> : null}
            {scene.visualType === "pathflow" ? <PathFlowDiagram payload={scene.visualPayload as any} accent={COLORS.primary} /> : null}
            {scene.visualType === "formulamorph" ? <FormulaMorph payload={scene.visualPayload as any} accent={COLORS.primary} /> : null}
            {scene.visualType === "editorial" ? (
              <div style={{height: 16, width: `${Math.min(100, 20 + frame * 0.3)}%`, backgroundColor: COLORS.primary, marginTop: 70, borderRadius: 999, boxShadow: `0 0 16px ${COLORS.primaryGlow}`}} />
            ) : null}
          </div>
        </div>

        {/* 底部进度条 */}
        <div
          style={{
            position: "absolute",
            left: SAFE_MARGIN_X,
            right: SAFE_MARGIN_X,
            bottom: 120,
            height: 7,
            backgroundColor: COLORS.premiumProgressBg,
            borderRadius: 999,
            zIndex: 5,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: COLORS.primary,
              borderRadius: 999,
              boxShadow: `0 0 10px ${COLORS.primaryGlow}`,
            }}
          />
        </div>

        {/* 引用标签 */}
        {scene.sourceRefs && scene.sourceRefs.length > 0 ? (
          <div
            style={{
              position: "absolute",
              left: SAFE_MARGIN_X,
              bottom: 75,
              display: "flex",
              gap: 10,
              opacity: interpolate(frame, [35, 65], [0, 1], {...clamp, easing: EASE.standard}),
              zIndex: 5,
            }}
          >
            {scene.sourceRefs.map((ref: string, i: number) => (
              <span
                key={i}
                style={{
                  ...glassStyle(0.4),
                  fontSize: 20,
                  fontWeight: 600,
                  color: COLORS.primaryLight,
                  borderRadius: 10,
                  padding: "6px 14px",
                }}
              >
                {ref}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
