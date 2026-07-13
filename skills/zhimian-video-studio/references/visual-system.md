# 智面引擎 Visual System

## Brand Tokens

### 米色编辑风（正文段 S2-S5）
- Background: `#F4EFE4`
- Ink: `#151515`
- Interview red: `#E83F32`
- AI blue: `#265CFF`
- Muted text: `#817B72`
- Paper: `#FFFDF7`

### 暗黑霓虹冲击风（钩子段 S1/S6）
- Dark background: `#0A0A0F`
- Dark surface: `#14141C`
- Dark surface alt: `#1E1E2A`
- Neon red: `#FF2D55`
- Neon blue: `#00D4FF`
- Neon amber: `#FFB300`
- Neon white: `#F5F5FA`

### 双基调路由（MANDATORY）
- S1 hook 场景 → 暗黑霓虹冲击风（`theme="dark"`）——开场 3 秒建立冲击
- S2-S5 正文段 / S6 mistake → 参考图基准风格（`theme="ref"`）——深色底 + 米色卡片 + 红蓝对比
- S4 followups（Q&A 对话类） → 米色编辑风（`theme="cream"`）——对话气泡在浅底上更清晰
- 由 `sceneTheme(visualType, sceneId)` 自动判定，组件接收 `theme` prop 切换配色与动效强度

### 参考图基准风格（v2 主视觉，S2-S6 默认）
- **Dark background**: `#121212`
- **Card background**: `#FFF8EE`（米白卡片，蓝色边框）
- **Card border**: `#265CFF`（4px 蓝色描边）
- **Ref red**: `#E63946`（问题/错误/警告/内存块）
- **Ref blue**: `#265CFF`（机制/正确/AI/标题下划线）
- **Ref muted text**: `#999999`（eyebrow 小字）
- **Paper bar bg**: `#2A1515`（论文引用条暗红底）
- **Paper bar text**: `#E8C4C4`（论文引用文字）
- **Progress bar**: 高度 10px，圆角 999，背景 `rgba(255,255,255,0.15)`，填充 `#265CFF`
- **头部品牌栏**：左 `大厂拆招·AI算法`（蓝色 30px 粗体），右 `智面引擎`（灰色 30px）
- **Eyebrow + 大标题结构**：eyebrow 带竖线前缀 + 大标题（白字 92px）+ 红/蓝下划线（8px 高，占标题 58% 宽）
- **底部结论卡**：全宽圆角矩形，红/蓝实底白字，带发光 boxShadow

## Layout

- Video: 1080×1920, 30fps, 60–120 seconds.
- Cover: label, three-line headline, benefit sentence, episode number.
- Safe margins: keep text away from app UI and captions.
- Opening: no long logo intro; enter the technical question within three seconds.

## Cover Headline（封面标题，直接影响封面点击率）

历史数据：封面点击率均 4.8%（健康线 8-12%），标题为宽泛概念陈述句的点击率最低（2.6%-3.6%），带"具体名词+反差/利益"的点击率最高（8.6%-9.9%）。封面标题必须按以下规范：

- **两段式结构**：`具体名词｜反差钩子`，中间用竖线分隔。例：`DP/DDP/ZeRO｜90%开口答错`、`RoPE位置编码｜90%的人讲不清为什么旋转`。
- **禁止宽泛陈述句**：如"Tokenizer会影响模型效果？""位置编码为什么需要？"——这类标题点击率 <4%。
- **钩子词必带**：标题后半段必含 `90% / 开口答错 / 被追问就哑 / OOM / 必问 / 筛掉一半 / 45秒讲透 / 别只背` 之一。
- **benefit sentence** 保留，但需与钩子呼应，不重复主标题。

## Motion Rules（冲击感升级，针对完播率 4.1% 痛点）

历史数据：完播率 4.1% + 平均观看 17.1 秒是流量差的第一根因。动效必须在前 3 秒建立冲击，否则平台不给后续曝光。

### 必备冲击动效（暗黑钩子段）
- **数字计数爆裂**：钩子数字（90%/OOM/8×）从 0 计数到目标值，到达瞬间 overshoot 爆裂 + scale 弹跳
- **屏幕震动**：关键冲击点（数字到达、红X爆破）用 `Math.sin(frame * k) * (1 - frame/duration) * amplitude` 实现衰减震动，振幅 6-10px，持续 10-14 帧
- **粒子辐射**：冲击瞬间 12 个粒子从中心向外辐射，配 `boxShadow` 发光
- **故障 glitch**：转场和关键行用 `Math.sin(frame * k) * shift` 横向错位 + 周期闪烁
- **发光 glow**：霓虹色元素必带 `textShadow` / `boxShadow` 发光，暗黑段 opacity 不低于 0.15

### 必备动效层次（所有段）
- Use `useCurrentFrame()`, `interpolate()`, and `spring()` with `overshootClamping: false` for impact entrances.
- Do not use CSS transitions, CSS animations, or Tailwind animation classes.
- One concept per scene. Use process animation when explaining calculations or data flow.
- Use red for interview/alert/failure concepts; blue for AI/process/tool concepts. 暗黑段用 neonRed/neonBlue 替代 interview/ai。
- Treat HyperFrames as the motion-design grammar and Remotion as the final deterministic renderer. Follow `hyperframes-motion.md`.
- Every scene needs a build/breathe/resolve rhythm, an entrance for every major element, and a transition-led handoff.
- Use at least three layers per scene: ambient background, foreground concept visual, and an accent such as marker sweep, burst, cursor, scan, or pulse.
- Vary entrance direction, duration, and easing character by scene. Repeating the same rise-and-fade pattern is a QA failure.
- Preserve the approved cover composition unless the user explicitly requests a cover redesign.
- Generate 2–4 original concept images per episode when model image generation is available. Follow `generative-visuals.md` for scene selection, prompting, audit metadata, and fallback.
- Present generated images inside the editorial system: ink border, cream/black framing, category accent, purposeful crop, slow frame-driven camera motion, and readable captions outside the bitmap.
- Keep factual text, labels, formulas, and data in Remotion layers. Generated pixels must not be the source of factual claims.
- Do not produce a video that is only text cards. Each production should include at least two motion templates:
  - `flow`: steps connected by an animated line or moving signal — 节点脉冲发光 + 电流连线 + 信号点沿线流动

### MotionFX 动效组件库（v3 新增，HyperFrames 风格移植）

位置：`remotion/src/components/MotionFX.tsx`。所有组件均用 `useCurrentFrame()` + `spring()` + `interpolate()` 实现，确定性渲染无副作用。

| 组件 | 用途 | 关键 props | 使用场景 |
|------|------|-----------|---------|
| `MarkerSweep` | 倾斜光带扫过元素，高亮标记 | `delay`, `color`, `width`, `skew`, `repeat`, `repeatGap` | 每张卡片入场后扫光；公式卡重复扫光 |
| `BurstLines` | 从中心向外发射 SVG 线条，爆发感 | `delay`, `count`, `radius`, `color`, `lineWidth` | 最后一张卡片/汇聚卡/✕✓标志爆发 |
| `SketchCircle` | 手绘风格圆圈，SVG 描边动画 | `delay`, `size`, `color`, `strokeWidth`, `x`, `y` | 关键概念 token 强调；论文引用图标 |
| `KineticText` | 逐字弹入动态排版，4 种模式 | `text`, `delay`, `stagger`, `mode`(rise/pop/blur/scatter) | 步骤文字/标签/问题/回答逐字弹入 |
| `GlitchShift` | RGB 分离 + 水平抖动，数字故障感 | `delay`, `duration`, `intensity` | 追问问题/大标题故障偏移 |
| `ParticleBurst` | 粒子从中心飞散，冲击瞬间 | `delay`, `count`, `color`, `maxSize`, `spread` | 结论卡粒子爆发 |
| `ScanLine` | 水平线从上到下扫描，科技感 | `delay`, `duration`, `color`, `thickness` | 公式卡/阶梯卡扫描线 |
| `ClipReveal` | clip-path 遮罩揭示入场 | `delay`, `direction`(left/right/center/top) | 论文引用条/卡片遮罩揭示 |
| `PulseRing` | 脉冲圆环从中心扩散 | `delay`, `repeat`, `color`, `maxRadius` | 序号圆/结论卡/✓标志脉冲 |

### 持续运动型组件（v4 新增，HyperFrames 标志性能力）

HyperFrames 核心原则：**画面始终在呼吸，元素永不静止**。以下组件提供持续运动，区别于上表的"瞬时触发即消失"型。

| 组件 | 用途 | 关键 props | 使用场景 |
|------|------|-----------|---------|
| `FlowField` | conic-gradient 旋转+呼吸的流动背景层 | `color1/2/3`, `opacity`, `speed`, `breathSpeed` | 每个场景根容器最底层氛围层 |
| `IdleFloat` | 元素入场后持续 sin 波形微动 | `amplitude`, `speed`, `rotateAmp`, `delay` | 卡片/标题入场完成后包裹，保持"活气" |
| `CursorTrail` | 光点+拖尾从A到B移动 | `fromX/Y`, `toX/Y`, `color`, `size`, `trailLength` | code场景光标/公式场景强调点 |
| `ParallaxLayer` | 3D视差层，基于帧的translateZ模拟 | `depth`(0-1), `direction`, `amplitude` | 背景层纵深感 |
| `TypewriterLine` | 逐字打字机+光标闪烁 | `text`, `charsPerFrame`, `showCursor`, `cursorBlinkSpeed` | code场景终端打字 |
| `GlitchBar` | 周期性横向故障条，整屏偶发干扰 | `delay`, `interval`, `duration`, `color`, `maxBars` | 暗黑段信号干扰 |
| `ShimmerText` | 高光从左到右持续流过文字 | `color`, `highlightColor`, `speed`, `width` | 大标题/重点文字流光 |
| `BreathingGlow` | boxShadow/textShadow 强度持续呼吸 | `color`, `minBlur`, `maxBlur`, `speed`, `type`(box/text) | 发光元素替代静态shadow |

**v4 使用原则（升级）**：
- 每个场景必须包含：1个 FlowField 背景层 + 至少1个 IdleFloat 持续微动 + 至少1个 ShimmerText 或 BreathingGlow 持续发光
- 暗黑段（S1 hook）额外加 GlitchBar 周期故障条
- code 场景用 TypewriterLine 替换静态文本
- IdleFloat 的 delay 必须设在入场动画完成后（避免破坏入场）
- BreathingGlow 包裹元素时移除原有静态 boxShadow/textShadow（避免冲突）
- FlowField 放在根容器最底层（zIndex 0），内容层在上面
- 瞬时型组件（上表）用于入场/冲击瞬间，持续型组件（本表）用于维持"画面始终在动"
- 每个场景至少使用 3 种不同 MotionFX 效果（HyperFrames 原则：不重复入场模式）
- MarkerSweep 需要父容器 `position: relative` + `overflow: hidden`
- KineticText 的 `mode` 应与卡片入场模式不同，增加层次
- BurstLines/ParticleBurst/PulseRing 是瞬间动效，delay 控制触发时机
- 所有 delay 基于场景内相对帧数（场景起始帧自动偏移）
  - `comparison`: two options/cards enter separately, then the stronger answer wins — 数字计数爆裂 + 红X爆破(失败方) + 蓝✓发光(获胜方) + WIN故障印章
  - `formula`: concepts reveal as tokens and the final mental model is highlighted — token逐个从上方炸入 + 高亮框发光脉冲 + 最终整体放大
  - `process`: numbered steps appear sequentially — 阶梯攀升入场 + 数字计数 + 发光脉冲 + 最终汇聚框架
  - `code`: technical follow-up or pseudo-code reveals as a card — 黑色终端卡 + 逐字打字 + 光标闪烁 + 关键行故障高亮
- Background motion should be subtle but visible: 暗黑段 opacity 0.10-0.35（网格/扫描线/粒子），米色段 opacity 0.05-0.22（几何/光斑/粒子）。Do not use opacity below 0.05 — it is invisible and wastes render budget.

## Animation Timing Benchmarks（帧数参考）

| 动效 | 帧范围 | 说明 |
| --- | --- | --- |
| 数字计数 | 0-12 | 0→目标值，eased |
| 数字爆裂 | 10-18 | 到达瞬间 overshoot scale |
| 屏幕震动 | 10-22 | 衰减 sin，振幅 10px |
| 粒子辐射 | 10-30 | 12粒子向外辐射 |
| hookline | 18-36 | 主标题入场 |
| marker sweep | 30-48 | 发光下划线 |
| 左右卡 | 42-72 | 错开入场 |
| WIN印章 | 96+ | 故障弹入 |
| token炸入 | 8+i*8 | 每个 token 错开 8 帧 |
| 终端打字 | 22+ | 每字 2 帧，行间 +6 帧 |
| 阶梯攀升 | 8+i*16 | 每步错开 16 帧 |

## Color Contrast（暗黑段必读）

- 暗黑背景 `#0A0A0F` 上：霓虹白 `#F5F5FA` 文字对比度 > 15:1（通过）；霓虹红/蓝用于强调必带 `textShadow: 0 0 Npx color` 发光
- 米色背景 `#F4EFE4` 上：ink `#151515` 文字对比度 > 12:1（通过）；interview/ai 用于强调
- 禁止在暗黑段使用低饱和度灰文字（不可读）；禁止在米色段使用纯白文字（对比不足）
