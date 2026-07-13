import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, EASE, glassStyle} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/**
 * 流程图 — 电影级步骤可视化
 *
 * 设计哲学：
 * - 清晰的步骤层次
 * - 连接线有方向感
 * - 克制的动画
 */
export const ProcessDiagram: React.FC<{
  payload: {steps: string[]};
  accent: string;
  theme?: "dark" | "cream" | "ref";
}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const steps = payload.steps ?? ["步骤1", "步骤2", "步骤3"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
        position: "relative",
      }}
    >
      {steps.map((step, i) => {
        const delay = i * 15;
        const enter = interpolate(frame, [delay, delay + 35], [0, 1], {
          ...clamp,
          easing: EASE.inertial,
        });
        const enterX = (1 - enter) * -60;
        const enterOpacity = enter;

        // 连接线
        const lineGrow = interpolate(frame, [delay + 20, delay + 40], [0, 1], {
          ...clamp,
          easing: EASE.standard,
        });

        // 呼吸浮动
        const floatY = Math.sin(frame / 100 + i * 0.5) * 3;

        return (
          <div key={i} style={{position: "relative"}}>
            {/* 步骤卡片 */}
            <div
              style={{
                ...glassStyle(0.65),
                padding: "28px 36px",
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: enterOpacity,
                transform: `translateX(${enterX}px) translateY(${floatY}px)`,
                position: "relative",
              }}
            >
              {/* 序号 */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${accent}40, ${accent}20)`,
                  border: `2px solid ${accent}60`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  boxShadow: `0 0 20px ${accent}30`,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>

              {/* 步骤文字 */}
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                  lineHeight: 1.3,
                }}
              >
                {step}
              </div>
            </div>

            {/* 连接线 */}
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 28,
                  top: "100%",
                  width: 3,
                  height: 20,
                  background: `linear-gradient(to bottom, ${accent}60, ${accent}20)`,
                  transform: `scaleY(${lineGrow})`,
                  transformOrigin: "top",
                  borderRadius: 2,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
