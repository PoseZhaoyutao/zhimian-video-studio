import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, EASE} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

interface NodeDef {
  id: string;
  label: string;
  x: number; // % of container width
  y: number; // % of container height
  active?: boolean;
}

interface EdgeDef {
  from: string;
  to: string;
}

/**
 * NodeGraph — 知识图谱节点逐个点亮 + SVG 连接线路径生长
 *
 * 纯帧驱动：节点 spring 入场 → 连接线 stroke-dashoffset 描边生长 → 活跃节点脉冲光圈 →
 * 边上流动光点沿路径循环移动。
 */
export const NodeGraph: React.FC<{
  payload: {nodes: NodeDef[]; edges: EdgeDef[]};
  accent: string;
}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = payload.nodes ?? [];
  const edges = payload.edges ?? [];

  const nodeProgress = nodes.map((_, i) =>
    spring({frame: frame - i * 12, fps, config: {damping: 16, stiffness: 180, overshootClamping: false}}),
  );

  // 边：两端都入场后开始描边
  const edgeProgress = edges.map((e) => {
    const fromIdx = nodes.findIndex((n) => n.id === e.from);
    const toIdx = nodes.findIndex((n) => n.id === e.to);
    const edgeDelay = Math.max(fromIdx, toIdx) * 12 + 18;
    return {
      delay: edgeDelay,
      progress: interpolate(frame, [edgeDelay, edgeDelay + 30], [0, 1], {
        ...clamp,
        easing: EASE.inertial,
      }),
    };
  });

  return (
    <div style={{position: "relative", width: "100%", aspectRatio: "1/1.1", maxWidth: 900, margin: "0 auto"}}>
      <svg
        viewBox="0 0 900 990"
        style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}
      >
        {/* 背景织网 — 极细连线 */}
        {nodes.map((a, i) =>
          nodes.slice(i + 1).map((b) => {
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist > 40) return null;
            return (
              <line
                key={`bg-${a.id}-${b.id}`}
                x1={`${a.x}%`}
                y1={`${a.y}%`}
                x2={`${b.x}%`}
                y2={`${b.y}%`}
                stroke={COLORS.primary}
                strokeWidth={0.5}
                opacity={0.08}
              />
            );
          }),
        )}

        {/* 连接线路径描边生长 + 流动光点 */}
        {edges.map((e, i) => {
          const fromNode = nodes.find((n) => n.id === e.from);
          const toNode = nodes.find((n) => n.id === e.to);
          if (!fromNode || !toNode) return null;
          const {delay: edgeDelay, progress} = edgeProgress[i];
          const p = Math.max(0, Math.min(1, progress));
          const x1 = (fromNode.x / 100) * 900;
          const y1 = (fromNode.y / 100) * 990;
          const x2 = (toNode.x / 100) * 900;
          const y2 = (toNode.y / 100) * 990;
          const len = Math.hypot(x2 - x1, y2 - y1);

          // 帧驱动流动光点：描边完成后开始循环
          const flowStart = edgeDelay + 35;
          const flowT = ((frame - flowStart) * 0.015) % 1;
          const flowActive = frame > flowStart && p > 0.9;
          const dotX = x1 + (x2 - x1) * flowT;
          const dotY = y1 + (y2 - y1) * flowT;
          // 拖尾
          const trailT1 = ((frame - flowStart - 3) * 0.015) % 1;
          const trailT2 = ((frame - flowStart - 6) * 0.015) % 1;
          const trail1X = x1 + (x2 - x1) * trailT1;
          const trail1Y = y1 + (y2 - y1) * trailT1;
          const trail2X = x1 + (x2 - x1) * trailT2;
          const trail2Y = y1 + (y2 - y1) * trailT2;

          return (
            <g key={`edge-${e.from}-${e.to}`}>
              {/* 底层发光线 */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={accent}
                strokeWidth={3}
                strokeOpacity={p * 0.15}
                filter="url(#ngGlow)"
              />
              {/* 主描线 — dashoffset 驱动路径生长 */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={accent}
                strokeWidth={2}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - p)}
                strokeLinecap="round"
                opacity={p * 0.7}
              />
              {/* 拖尾光点 */}
              {flowActive && (
                <>
                  <circle cx={trail2X} cy={trail2Y} r={2} fill={accent} opacity={0.2} />
                  <circle cx={trail1X} cy={trail1Y} r={3} fill={accent} opacity={0.4} />
                  <circle cx={dotX} cy={dotY} r={4} fill={accent} opacity={0.9}>
                    {/* glow via duplicate + filter */}
                  </circle>
                  <circle cx={dotX} cy={dotY} r={8} fill={accent} opacity={0.15} filter="url(#ngGlow)" />
                </>
              )}
            </g>
          );
        })}

        {/* 节点 */}
        {nodes.map((node, i) => {
          const p = Math.max(0, Math.min(1, nodeProgress[i]));
          const cx = (node.x / 100) * 900;
          const cy = (node.y / 100) * 990;
          const isActive = node.active ?? false;
          // 帧驱动脉冲
          const pulseR = isActive && p > 0.9
            ? 28 + Math.sin(frame * 0.08 + i * 0.8) * 4
            : 28;
          const pulseOpacity = isActive && p > 0.9
            ? 0.15 + Math.sin(frame * 0.08 + i * 0.8) * 0.1
            : 0;
          const coreR = isActive && p > 0.9
            ? 8 + Math.sin(frame * 0.1 + i) * 1.5
            : 8;

          return (
            <g key={node.id} opacity={p} transform={`translate(${cx},${cy}) scale(${0.3 + p * 0.7})`}>
              {/* 激活脉冲光圈 — 帧驱动 */}
              {isActive && p > 0.9 && (
                <>
                  <circle
                    r={pulseR + 12}
                    fill="none"
                    stroke={accent}
                    strokeWidth={1.5}
                    opacity={pulseOpacity * 0.6}
                  />
                  <circle
                    r={pulseR + 6}
                    fill="none"
                    stroke={accent}
                    strokeWidth={1}
                    opacity={pulseOpacity}
                  />
                </>
              )}
              {/* 外环 */}
              <circle
                r={28}
                fill={COLORS.spaceLight}
                stroke={isActive ? accent : `${accent}60`}
                strokeWidth={2}
                opacity={0.9}
              />
              {/* 内核 — 帧驱动呼吸 */}
              <circle r={coreR} fill={accent} opacity={isActive ? 0.9 : 0.4} />
              {/* 标签 */}
              <text
                y={48}
                textAnchor="middle"
                fill={COLORS.textPrimary}
                fontSize={22}
                fontWeight={700}
                fontFamily={'"Microsoft YaHei", "PingFang SC", sans-serif'}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* SVG 滤镜 */}
        <defs>
          <filter id="ngGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={4} />
          </filter>
        </defs>
      </svg>
    </div>
  );
};