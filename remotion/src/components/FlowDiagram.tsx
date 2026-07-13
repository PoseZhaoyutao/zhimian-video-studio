import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, EASE, glassStyle} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/**
 * 流程图 — 电影级数据流可视化
 *
 * 设计哲学：
 * - 数据流有方向感
 * - 节点清晰可读
 * - 克制的动画
 */
export const FlowDiagram: React.FC<{
  payload: {nodes: string[]; connections?: number[][]};
  accent: string;
  theme?: "dark" | "cream" | "ref";
}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const nodes = payload.nodes ?? ["输入", "处理", "输出"];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        width: "100%",
        position: "relative",
        padding: "40px 0",
      }}
    >
      {nodes.map((node, i) => {
        const delay = i * 18;
        const enter = interpolate(frame, [delay, delay + 35], [0, 1], {
          ...clamp,
          easing: EASE.inertial,
        });
        const enterScale = 0.85 + enter * 0.15;
        const enterOpacity = enter;

        // 连接线
        const lineGrow = interpolate(frame, [delay + 20, delay + 40], [0, 1], {
          ...clamp,
          easing: EASE.standard,
        });

        // 呼吸浮动
        const floatY = Math.sin(frame / 100 + i * 0.6) * 4;

        return (
          <div key={i} style={{display: "flex", alignItems: "center", gap: 32}}>
            {/* 节点 */}
            <div
              style={{
                ...glassStyle(0.65),
                padding: "32px 40px",
                opacity: enterOpacity,
                transform: `scale(${enterScale}) translateY(${floatY}px)`,
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                  textAlign: "center",
                }}
              >
                {node}
              </div>
            </div>

            {/* 连接线 */}
            {i < nodes.length - 1 && (
              <div
                style={{
                  width: 60,
                  height: 3,
                  background: `linear-gradient(to right, ${accent}60, ${accent}20)`,
                  transform: `scaleX(${lineGrow})`,
                  transformOrigin: "left",
                  borderRadius: 2,
                  position: "relative",
                }}
              >
                {/* 箭头 */}
                <div
                  style={{
                    position: "absolute",
                    right: -8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: `10px solid ${accent}60`,
                    borderTop: "6px solid transparent",
                    borderBottom: "6px solid transparent",
                    opacity: lineGrow,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
