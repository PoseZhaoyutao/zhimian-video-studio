import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// 一比一移植自 hyperframes/scene-3-ddp-ring/index.html
// 结构：标题 → 4 GPU 节点环形 → 梯度包沿环流动(reduce-scatter) → all-gather → O(N²)→O(N) → 残留限制红字
export const RingTopology: React.FC<{payload: Record<string, unknown>; accent: string}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleLeft = String(payload.title_left ?? "DDP：Ring AllReduce");
  const titleRight = String(payload.title_right ?? "提速");
  const residual = String(payload.residual ?? "但每卡仍存全份 → 显存没省");

  // 时序
  const titleIn = spring({frame: frame - 3, fps, config: {damping: 18, stiffness: 130}});
  const nodeIn = [15, 20, 24, 29].map((f) => spring({frame: frame - f, fps, config: {damping: 14, stiffness: 200, overshootClamping: false}}));
  const ringIn = spring({frame: frame - 30, fps, config: {damping: 18, stiffness: 130}});
  const stage1In = spring({frame: frame - 39, fps, config: {damping: 16, stiffness: 150}});
  // 梯度包流动 (1.5s=45帧 开始, 每段0.5s=15帧)
  const pktOpacity = interpolate(frame, [45, 51], [0, 1], clamp);
  // 4段路径，用插值
  const pktPos = interpolate(frame, [51, 150], [0, 4], clamp); // 0→4 一圈
  const stage1Out = interpolate(frame, [108, 117], [1, 0], clamp);
  const stage2In = interpolate(frame, [111, 120], [0, 1], clamp);
  const cxIn = spring({frame: frame - 123, fps, config: {damping: 14, stiffness: 180, overshootClamping: false}});
  const resIn = spring({frame: frame - 138, fps, config: {damping: 12, stiffness: 200, overshootClamping: false}});

  // 梯度包位置（环半径 320，中心 0,0）
  const angle = pktPos * Math.PI * 0.5 - Math.PI / 2; // 从顶部开始顺时针
  const pktX = Math.cos(angle) * 320;
  const pktY = Math.sin(angle) * 320;

  // 节点位置（12/3/6/9点）
  const nodes = [
    {x: 0, y: -320, label: "GPU0"},
    {x: 320, y: 0, label: "GPU1"},
    {x: 0, y: 320, label: "GPU2"},
    {x: -320, y: 0, label: "GPU3"},
  ];

  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 24}}>
      {/* 标题 */}
      <div style={{fontSize: 46, fontWeight: 950, color: COLORS.ink, textAlign: "center", opacity: Math.max(0, Math.min(1, titleIn)), transform: `translateY(${(1 - titleIn) * 30}px)`}}>
        {titleLeft} <span style={{color: COLORS.ai}}>{titleRight}</span>
      </div>

      {/* 环形拓扑 */}
      <div style={{position: "relative", width: 760, height: 760, marginTop: 8}}>
        {/* 虚线环 */}
        <div
          style={{
            position: "absolute",
            inset: 60,
            border: `8px dashed ${COLORS.ai}59`,
            borderRadius: 999,
            opacity: Math.max(0, Math.min(1, ringIn)),
            transform: `scale(${0.7 + ringIn * 0.3})`,
          }}
        />
        {/* 4 节点 */}
        {nodes.map((n, i) => {
          const ni = Math.max(0, Math.min(1, nodeIn[i]));
          return (
            <div
              key={n.label}
              style={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: 30,
                backgroundColor: COLORS.paper,
                border: `6px solid ${COLORS.ai}`,
                display: "grid",
                placeItems: "center",
                fontSize: 36,
                fontWeight: 950,
                color: COLORS.ai,
                boxShadow: `0 14px 0 ${COLORS.ai}33`,
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${n.x}px, ${n.y}px) scale(${0.3 + ni * 0.7})`,
                opacity: ni,
              }}
            >
              {n.label}
            </div>
          );
        })}
        {/* 梯度包 */}
        <div
          style={{
            position: "absolute",
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: COLORS.interview,
            color: COLORS.paper,
            display: "grid",
            placeItems: "center",
            fontSize: 26,
            fontWeight: 950,
            boxShadow: "0 6px 0 rgba(21,21,21,0.2)",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${pktX}px, ${pktY}px)`,
            opacity: pktOpacity,
          }}
        >
          ∇
        </div>
      </div>

      {/* stage 标签 */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          backgroundColor: COLORS.ink,
          color: COLORS.paper,
          padding: "12px 26px",
          borderRadius: 18,
          fontSize: 30,
          fontWeight: 950,
          opacity: stage1In > 0.1 ? stage1In : stage2In,
        }}
      >
        {stage1In > 0.1 ? (
          <>
            <span style={{background: COLORS.ai, color: COLORS.paper, padding: "3px 10px", borderRadius: 8, fontSize: 24}}>1</span>
            reduce-scatter 分段汇总
          </>
        ) : (
          <>
            <span style={{background: COLORS.ai, color: COLORS.paper, padding: "3px 10px", borderRadius: 8, fontSize: 24}}>2</span>
            all-gather 广播结果
          </>
        )}
      </div>

      {/* 复杂度 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontSize: 46,
          fontWeight: 950,
          fontVariantNumeric: "tabular-nums",
          opacity: Math.max(0, Math.min(1, cxIn)),
          transform: `scale(${0.7 + Math.min(1, cxIn) * 0.3})`,
        }}
      >
        <span style={{color: COLORS.interview, textDecoration: "line-through", textDecorationThickness: 5}}>O(N²)</span>
        <span style={{color: COLORS.muted, fontSize: 40}}>→</span>
        <span style={{color: COLORS.ai}}>O(N)</span>
      </div>

      {/* 残留限制 */}
      <div
        style={{
          backgroundColor: COLORS.interview,
          color: COLORS.paper,
          padding: "16px 30px",
          borderRadius: 20,
          fontSize: 34,
          fontWeight: 950,
          border: `4px solid ${COLORS.ink}`,
          boxShadow: "0 12px 0 rgba(21,21,21,0.2)",
          textAlign: "center",
          opacity: Math.max(0, Math.min(1, resIn)),
          transform: `scale(${0.5 + Math.min(1, resIn) * 0.5})`,
        }}
      >
        {residual}
      </div>
    </div>
  );
};
