import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, EASE} from "../design";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

interface PFNode {
  id: string;
  label: string;
  x: number; // 0-100, position along path as %
  y: number; // 0-100, vertical offset in viewBox
  color?: string;
  sizeChange?: number;
}

/**
 * PathFlowDiagram — 数据沿路径流经处理节点
 *
 * 粒子沿水平路径匀速流动，经过节点时触发激活脉冲，
 * 颜色和大小在节点处发生变化。全部帧驱动。
 */
export const PathFlowDiagram: React.FC<{
  payload: {nodes: PFNode[]; label?: string};
  accent: string;
}> = ({payload, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = payload.nodes ?? [];
  const sectionLabel = payload.label;

  const W = 920;
  const H = 320;
  const pathY = H * 0.5; // 路径在垂直中间
  const marginX = 50;
  const pathLen = W - marginX * 2;

  // 节点入场
  const nodeIn = nodes.map((_, i) =>
    spring({frame: frame - 5 - i * 10, fps, config: {damping: 14, stiffness: 200, overshootClamping: false}}),
  );

  // 路径描边生长
  const pathProgress = interpolate(frame, [5, 40], [0, 1], {
    ...clamp,
    easing: EASE.inertial,
  });

  // 粒子
  const particleCount = 5;
  const particles = Array.from({length: particleCount}, (_, i) => {
    const offset = i * (1 / particleCount);
    const t = ((frame * 0.007) + offset) % 1;
    const px = marginX + t * pathLen;

    let color = accent;
    let size = 5;

    for (const node of nodes) {
      const nodeT = node.x / 100;
      if (Math.abs(t - nodeT) < 0.06) {
        color = node.color ?? accent;
        size = 5 * (node.sizeChange ?? 1);
        break;
      }
    }

    return {t, px, color, size};
  });

  // 节点脉冲
  const nodePulse = nodes.map((node, i) => {
    const nodeT = node.x / 100;
    // 检查任意粒子是否在节点附近
    let near = false;
    for (const p of particles) {
      if (Math.abs(p.t - nodeT) < 0.05 && frame > 40) {
        near = true;
        break;
      }
    }
    return {
      near,
      r: near ? 30 + Math.sin(frame * 0.15 + i) * 8 : 0,
      opacity: near ? 0.25 : 0,
    };
  });

  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 16}}>
      {sectionLabel && (
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: COLORS.textSecondary,
            opacity: interpolate(frame, [0, 20], [0, 1], clamp),
          }}
        >
          {sectionLabel}
        </div>
      )}

      <div style={{position: "relative", width: "100%", maxWidth: W, height: H}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
          {/* 路径底线 */}
          <line
            x1={marginX} y1={pathY} x2={W - marginX} y2={pathY}
            stroke={`${accent}15`}
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* 路径描边生长 */}
          <line
            x1={marginX} y1={pathY} x2={W - marginX} y2={pathY}
            stroke={accent}
            strokeWidth={2}
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen * (1 - pathProgress)}
            strokeLinecap="round"
            opacity={pathProgress * 0.4}
            filter="url(#pfGlow)"
          />

          {/* 粒子 */}
          {particles.map((p, i) => (
            <g key={i}>
              <circle cx={p.px} cy={pathY} r={p.size * 0.5} fill={p.color} opacity={0.25} filter="url(#pfGlow)" />
              <circle cx={p.px} cy={pathY} r={p.size} fill={p.color} opacity={0.85} />
              <circle cx={p.px} cy={pathY} r={p.size * 0.35} fill="#fff" opacity={0.5} />
            </g>
          ))}

          {/* 节点 */}
          {nodes.map((node, i) => {
            const ni = Math.max(0, Math.min(1, nodeIn[i]));
            const cx = marginX + (node.x / 100) * pathLen;
            const cy = (node.y / 100) * H;
            const pulse = nodePulse[i];
            const nc = node.color ?? accent;

            return (
              <g key={node.id} opacity={ni} transform={`translate(${cx},${cy}) scale(${0.4 + ni * 0.6})`}>
                {pulse.near && (
                  <>
                    <circle r={pulse.r + 10} fill="none" stroke={nc} strokeWidth={1.5} opacity={pulse.opacity * 0.5} />
                    <circle r={pulse.r} fill="none" stroke={nc} strokeWidth={1} opacity={pulse.opacity} />
                  </>
                )}
                <rect
                  x={-52} y={-26}
                  width={104} height={52}
                  rx={14}
                  fill={COLORS.glass.bg}
                  stroke={`${nc}60`}
                  strokeWidth={1.5}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={COLORS.textPrimary}
                  fontSize={20}
                  fontWeight={700}
                  fontFamily={'"Microsoft YaHei", "PingFang SC", sans-serif'}
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          <defs>
            <filter id="pfGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={6} />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
};