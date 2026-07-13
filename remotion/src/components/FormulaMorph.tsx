import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, EASE, glassStyle, MONO_FAMILY} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

interface Token {
  text: string;
  highlight?: boolean; // 当前步骤高亮
}

interface Step {
  tokens: Token[];
  label?: string; // 步骤说明，显示在右侧
}

/**
 * FormulaMorph — 公式逐步推导，token 物理位移重组
 *
 * 设计原则：
 * - 每一步是一个 token 数组，步骤间 token 做 spring 位移 + 淡入淡出
 * - 高亮 token 有辉光强调
 * - 步骤标签在左侧时间轴上标注
 */
export const FormulaMorph: React.FC<{
  payload: {steps: Step[]};
  accent: string;
}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const steps = payload.steps ?? [];

  // 每个 step 在 [stepStart, stepEnd] 区间可见
  const framesPerStep = 60; // 每步 2 秒
  const stepOverlap = 15; // 步骤间重叠帧

  return (
    <div style={{display: "flex", flexDirection: "column", width: "100%", gap: 20}}>
      {steps.map((step, si) => {
        const stepStart = si * (framesPerStep - stepOverlap);
        const stepEnd = stepStart + framesPerStep;

        // step 整体可见度
        const stepVisible = interpolate(frame, [stepStart, stepStart + 20], [0, 1], {
          ...clamp,
          easing: EASE.inertial,
        });
        const stepFade = interpolate(frame, [stepEnd - 15, stepEnd], [1, 0.3], {
          ...clamp,
          easing: EASE.standard,
        });
        const stepOpacity = Math.max(0, Math.min(1, stepVisible)) * Math.max(0.2, stepFade);

        // step 整体位移（从下方滑入）
        const stepY = interpolate(frame, [stepStart, stepStart + 25], [30, 0], {
          ...clamp,
          easing: EASE.inertial,
        });

        return (
          <div
            key={si}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: stepOpacity,
              transform: `translateY(${stepY}px)`,
              padding: "20px 28px",
              borderRadius: 16,
              background: stepOpacity > 0.5 ? `rgba(16,14,40,0.4)` : "transparent",
              border: `1px solid ${accent}15`,
            }}
          >
            {/* 步骤序号 */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${accent}40, ${accent}15)`,
                border: `1.5px solid ${accent}50`,
                display: "grid",
                placeItems: "center",
                fontSize: 20,
                fontWeight: 800,
                color: accent,
                flexShrink: 0,
              }}
            >
              {si + 1}
            </div>

            {/* 公式 tokens */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: 4,
                flex: 1,
                fontFamily: MONO_FAMILY,
              }}
            >
              {step.tokens.map((token, ti) => {
                // 每个 token 个体入场
                const tokenDelay = stepStart + 8 + ti * 3;
                const tokenIn = spring({
                  frame: frame - tokenDelay,
                  fps,
                  config: {damping: 18, stiffness: 220, mass: 0.6},
                });
                const tOpacity = Math.max(0, Math.min(1, tokenIn));

                // 高亮 token 的辉光
                const isHighlighted = token.highlight && stepOpacity > 0.5;
                const glowPulse = isHighlighted
                  ? 0.4 + Math.sin(frame * 0.1 + ti) * 0.15
                  : 0;

                return (
                  <span
                    key={ti}
                    style={{
                      fontSize: 42,
                      fontWeight: 700,
                      color: isHighlighted ? accent : COLORS.textPrimary,
                      opacity: tOpacity * (isHighlighted ? 1 : 0.85),
                      transform: `translateY(${(1 - tOpacity) * 15}px) scale(${0.85 + tOpacity * 0.15})`,
                      textShadow: isHighlighted
                        ? `0 0 ${20 * glowPulse}px ${accent}60`
                        : "none",
                      transition: "none",
                    }}
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>

            {/* 步骤说明 */}
            {step.label && (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  opacity: interpolate(frame, [stepStart + 20, stepStart + 35], [0, 1], clamp),
                  flexShrink: 0,
                  maxWidth: 180,
                  textAlign: "right",
                }}
              >
                {step.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};