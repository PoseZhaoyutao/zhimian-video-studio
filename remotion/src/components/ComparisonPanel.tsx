import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, EASE, glassStyle, glassActiveStyle} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const CARD_GAP = 28;

type Side = "left" | "right";

const Card: React.FC<{
  side: Side;
  text: string;
  color: string;
  enter: number;
  floatY: number;
  isWinner: boolean;
  glowAlpha: number;
}> = ({side, text, color, enter, floatY, isWinner, glowAlpha}) => {
  const xSign = side === "left" ? -1 : 1;
  const x = (1 - enter) * 100 * xSign;
  const scale = 0.9 + enter * 0.1;
  const lines = text.split("\n");

  const cardStyle = isWinner ? glassActiveStyle() : glassStyle(0.65);

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        ...cardStyle,
        padding: "36px 28px",
        textAlign: "center",
        opacity: enter,
        transform: `translateX(${x}px) translateY(${floatY}px) scale(${scale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        zIndex: 3,
      }}
    >
      {/* 赢家体积光 */}
      {isWinner && (
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: 24,
            background: `radial-gradient(ellipse at center, rgba(108,99,255,${glowAlpha * 0.3}) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color,
          lineHeight: 1.35,
          position: "relative",
          zIndex: 1,
        }}
      >
        {lines.map((ln, i) => (
          <span key={i} style={{display: "block"}}>
            {ln}
          </span>
        ))}
      </div>
    </div>
  );
};

export const ComparisonPanel: React.FC<{
  payload: {left: string; right: string; winner: "left" | "right" | "both"};
  accent: string;
  theme?: "dark" | "cream" | "ref";
  sceneId?: string;
}> = ({payload}) => {
  const frame = useCurrentFrame();

  const leftIsWinner = payload.winner === "left" || payload.winner === "both";
  const rightIsWinner = payload.winner === "right" || payload.winner === "both";

  // 卡片入场
  const leftEnter = interpolate(frame, [30, 70], [0, 1], {
    ...clamp,
    easing: EASE.inertial,
  });
  const rightEnter = interpolate(frame, [42, 82], [0, 1], {
    ...clamp,
    easing: EASE.inertial,
  });

  // 呼吸浮动
  const leftFloat = Math.sin(frame / 120) * 4;
  const rightFloat = Math.sin(frame / 120 + 0.6) * 4;

  // 赢家光晕呼吸
  const glowT = (Math.sin(frame / 100) + 1) / 2;
  const glowAlpha = interpolate(glowT, [0, 1], [0.15, 0.3], clamp);

  // 连接线生长
  const lineGrow = interpolate(frame, [55, 83], [0, 1], {
    ...clamp,
    easing: EASE.standard,
  });
  const lineOpacity = lineGrow * (0.5 + Math.sin(frame / 90) * 0.1);

  // 文字颜色
  const leftColor = leftIsWinner ? COLORS.primaryLight : COLORS.textSecondary;
  const rightColor = rightIsWinner ? COLORS.primaryLight : COLORS.textSecondary;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: CARD_GAP,
          width: "100%",
          position: "relative",
        }}
      >
        {/* 左卡 */}
        <div style={{flex: 1}}>
          <Card
            side="left"
            text={payload.left}
            color={leftColor}
            enter={leftEnter}
            floatY={leftFloat}
            isWinner={leftIsWinner}
            glowAlpha={glowAlpha}
          />
        </div>

        {/* 右卡 */}
        <div style={{flex: 1}}>
          <Card
            side="right"
            text={payload.right}
            color={rightColor}
            enter={rightEnter}
            floatY={rightFloat}
            isWinner={rightIsWinner}
            glowAlpha={glowAlpha}
          />
        </div>

        {/* 连接线 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 80,
            height: 2,
            background: `linear-gradient(to right, ${COLORS.primary}80, ${COLORS.accent}60)`,
            transform: `translate(-50%, -50%) scaleX(${lineGrow})`,
            opacity: lineOpacity,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        {/* 中心节点 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: COLORS.primaryLight,
            boxShadow: `0 0 16px ${COLORS.primaryGlow}`,
            transform: `translate(-50%, -50%) scale(${lineGrow})`,
            opacity: lineGrow,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
};
