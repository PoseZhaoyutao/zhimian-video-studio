import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const FlowDiagram: React.FC<{payload: Record<string, unknown>; accent: string}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const steps = Array.isArray(payload.steps)
    ? payload.steps.map(String)
    : ["输入", "处理", "验证", "输出"];
  const pulseX = interpolate(frame % 72, [0, 72], [0, 1], clamp);

  return (
    <div style={{position: "relative", height: 520, marginTop: 10}}>
      <div
        style={{
          position: "absolute",
          left: 34,
          top: 58,
          bottom: 60,
          width: 8,
          backgroundColor: "rgba(21,21,21,0.12)",
        }}
      />
      {steps.map((step, index) => {
        const appear = spring({frame: frame - index * 10, fps, config: {damping: 18, stiffness: 120}});
        const connector = interpolate(frame, [index * 18 + 12, index * 18 + 42], [0, 1], clamp);
        return (
          <div
            key={`${step}-${index}`}
            style={{
              position: "absolute",
              top: index * 112,
              left: 0,
              right: 0,
              opacity: Math.max(0, Math.min(1, appear)),
              transform: `translateX(${(1 - appear) * 76}px)`,
            }}
          >
            <div style={{display: "grid", gridTemplateColumns: "76px 1fr", alignItems: "center", gap: 24}}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 24,
                  backgroundColor: accent,
                  color: COLORS.paper,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 34,
                  fontWeight: 950,
                  boxShadow: `0 16px 0 rgba(21,21,21,0.14)`,
                }}
              >
                {index + 1}
              </div>
              <div style={{position: "relative", backgroundColor: COLORS.paper, border: `4px solid ${COLORS.ink}`, borderRadius: 28, padding: "24px 30px", fontSize: 40, fontWeight: 900}}>
                {step}
                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    right: 24,
                    bottom: -18,
                    height: 8,
                    backgroundColor: "rgba(21,21,21,0.1)",
                  }}
                >
                  <div style={{height: "100%", width: `${connector * 100}%`, backgroundColor: accent}} />
                  <div
                    style={{
                      position: "absolute",
                      left: `${Math.min(100, Math.max(0, pulseX * 100))}%`,
                      top: -9,
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      backgroundColor: accent,
                      transform: "translateX(-50%)",
                      opacity: index < steps.length - 1 ? 0.9 : 0,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
