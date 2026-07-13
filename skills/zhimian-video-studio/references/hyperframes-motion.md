# HyperFrames Motion Pass for 智面引擎

Use HyperFrames as the motion-design grammar while Remotion remains the final renderer and audio-driven timeline owner.

## Standard workflow (MANDATORY for every episode)

Every episode MUST pass through the HyperFrames design stage before Remotion rendering. No exceptions, no skipping straight to Remotion.

### Stage 1 — Design in HyperFrames (design source of truth)

Before writing any Remotion code, author each scene as a standalone HyperFrames composition:

1. Create `batch-runs/<batch>/<date>/hyperframes/scene-N-<id>/index.html` for every scene (6 per episode).
2. Each composition is 1080×1920, `data-duration="8"`, standalone (no `<template>` wrapper).
3. Use the project brand palette from `remotion/src/design.ts`: `--cream #F4EFE4`, `--ink #151515`, `--interview #E83F32` (red = low/wrong/follow-up), `--ai #265CFF` (blue = high/right/mechanism), `--muted #817B72`, `--paper #FFFDF7`.
4. Follow the per-scene motion playbook below for the visual structure.
5. Run `npx hyperframes lint <scene-dir>` — must be 0 errors before proceeding.

### Stage 2 — Snapshot review (user selects)

Render 3 timestamps per scene for user review:

```bash
cd batch-runs/<batch>/<date>/hyperframes
npx hyperframes snapshot scene-N-<id> --at 1.5,4,7 --no-end --describe false
```

- 1.5s = entrance mid-animation
- 4s = hero frame (most elements visible)
- 7s = resolve/hold state

Present all 6 scenes × 3 frames to the user. The user selects per-scene: accept as-is, or request changes. **Do not proceed to Stage 3 until the user explicitly confirms each scene.**

### Stage 3 — Port to Remotion (1:1)

After user confirmation, port each HyperFrames composition 1:1 to its Remotion component:

| HyperFrames scene | Remotion component | visual_type |
| --- | --- | --- |
| scene-1-hook | `ComparisonPanel.tsx` | `comparison` |
| scene-2-dp-problem | `FlowDiagram.tsx` | `flow` |
| scene-3-ddp-ring | `RingTopology.tsx` | `ring` |
| scene-4-zero-stages | `FormulaReveal.tsx` | `formula` |
| scene-5-tradeoff-code | `CodeCard.tsx` | `code` |
| scene-6-interview-dialogue | `ProcessDiagram.tsx` | `process` |

Port rules (non-negotiable):
- Every Remotion component MUST start with a comment: `// 一比一移植自 hyperframes/scene-N-<id>/index.html`
- GSAP `gsap.from()` → Remotion `spring()` with matching damping/stiffness
- GSAP `gsap.to()` width/opacity → Remotion `interpolate()` over equivalent frame range
- GSAP `back.out(N)` overshoot → Remotion `spring()` with `overshootClamping: false` and matching damping
- CSS static end-state is the ground truth; the Remotion tween describes the journey to get there
- Do not invent new colors, spacing, or layout not present in the HyperFrames source

### Stage 4 — Backup and preservation

HyperFrames source files are the **design source of truth** — they must survive:

1. Keep originals at `batch-runs/<batch>/<date>/hyperframes/scene-N-<id>/index.html`
2. Copy to `batch-runs/_hyperframes_backup/<date>-scene-N-<id>.html` after user confirms
3. Never delete HyperFrames sources after porting — they are the reference for future episodes and for verifying the Remotion port matches the approved design

### Why this workflow exists

- HyperFrames gives instant browser preview with real GSAP animation; Remotion's per-frame render is too slow for design iteration
- The user selects based on actual animated preview, not code description
- The 1:1 port guarantee means the final video matches what the user approved — no silent drift between design and render
- Source files survive so future episodes can reuse the motion grammar as templates

## Scene rhythm

Every scene follows three phases:

1. **Build (0–30%)** — reveal the headline first, then the visual payload with staggered entrances.
2. **Breathe (30–70%)** — keep the content readable and use one ambient motion only.
3. **Resolve (70–100%)** — hold the completed idea; the next scene's transition performs the visual exit.

## Required motion layers

Each scene should contain at least three visual layers:

- Background: oversized ghost type, an orbit, sweep, rail, or subtle geometric drift.
- Foreground: flow, comparison, formula, process, code, or editorial content.
- Accent: marker sweep, underline, burst, cursor, scan, pulse, or progress motion.

## Entrance variety

- Do not enter every element from below.
- Alternate left/right translation, scale, clipped reveal, rotation, and opacity-only entrances.
- Use faster motion for accents and slower motion for heavy headline/card elements.
- Stagger by narrative importance, not DOM order.

## Transitions

- Use an editorial push/wipe as the primary transition.
- Use the transition to hide the scene cut; do not empty the outgoing scene first.
- Keep transitions short enough that the first spoken idea still lands within three seconds.
- Use the same primary transition for consistency; reserve stronger accents for a topic change or final reveal.

## Motion typography

- Reveal headlines with clipped masks or directional movement.
- Add a deterministic marker sweep, underline, burst, or sketch accent to the key phrase.
- Keep body text readable for its full spoken interval; animation must not reduce reading time.

## Remotion mapping

| HyperFrames concept | Remotion implementation |
| --- | --- |
| `gsap.from()` entrance | `spring()` or `interpolate()` from hidden/off-position to the CSS end state |
| Marker sweep | `scaleX()` driven by frames |
| Push transition | Full-frame `SceneWipe` overlay at the beginning of the incoming scene |
| Ambient timeline | Deterministic `Math.sin()` / frame interpolation inside `MotionBackdrop` |
| Typewriter/cursor | Frame-derived character count and finite cursor blink |
| Stagger | Offset each item's frame passed into `spring()` |

Do not use CSS transitions, CSS animations, random values, infinite loops, or time-based browser state. The rendered frame number is the only clock.

## Per-scene motion playbook（电影级丝滑版）

Each scene follows the cinematic motion language: smooth easing, continuous trajectories, stable camera, breathing rhythm. The goal is premium educational visualization — not flashy impact, but sustained elegance.

### Core principles

1. **画面始终在呼吸，元素永不静止** — 每个可见元素都有持续的微动（3-5秒周期的sine浮动），幅度极小（2-6px），不打扰阅读。
2. **所有运动带有平滑缓动** — 禁止 `back.out`、`elastic.out`、`bounce`；统一使用 `power3.inOut`、`power2.inOut`、`sine.inOut`。
3. **信息按讲解顺序依次生成** — 每个元素在前一个元素动画完成70%时开始入场，形成连续的信息流。
4. **重点信息由暗到亮** — 关键节点先以低透明度存在，被"光线点亮"时透明度和辉光同步上升。
5. **转场无跳切** — 场景之间使用形态匹配、镜头推进、路径延伸等无缝转场，禁止闪白、故障、硬切。

### Scene 1 — Hook (`comparison` + 双节点深空浮现)

- 深空背景中两个发光节点从透明缓慢浮现，scale 0.85→1，duration 1.5s，`power3.inOut`。
- 两节点之间连线沿路径自然生长（scaleX 0→1，duration 1.2s），到达后节点被光线逐个点亮。
- 少量粒子（6-8个）沿弧线缓慢汇聚到节点，`sine.inOut`，duration 3s。
- 镜头从scale 0.94缓慢推近到1.0，duration 2.5s，`power2.inOut`。
- 禁止：数字爆裂、震屏、霓虹闪烁。
- 转场：推近进入左侧节点，画面自然放大进入下一场景。

### Scene 2 — Intuition (`flow` + 遮蔽光线扫过)

- token序列从左侧依次展开，每个token间隔0.3s，`power2.inOut`，duration 0.8s。
- 遮蔽光线从左到右缓慢扫过（translateX，duration 2s，`sine.inOut`），被扫到的token柔和变暗（opacity 0.3，filter blur 2px）。
- 连接线沿路径生长（height 0→full，duration 1.5s，`power2.inOut`）。
- 镜头平稳跟随光线移动。
- 禁止：节点脉冲、电流效果、高对比霓虹。
- 转场：遮蔽区域放大进入内部。

### Scene 3 — Principle (`comparison` + 双向汇聚)

- 两侧信息流粒子从两端沿路径流向中心，`sine.inOut`，duration 2.5s。
- 中心节点在粒子到达时被点亮（opacity 0→1 + boxShadow 0→30px glow，duration 1.5s）。
- 镜头环绕中心节点缓慢旋转半圈（rotation 0→180，duration 3s，`power2.inOut`）。
- 对比卡片柔和滑入（x ±80→0，scale 0.92→1，duration 1.2s，`power3.inOut`）。
- 禁止：token炸入、旋转入场、过冲弹跳。
- 转场：中心token变形为下一场景的百分比数字。

### Scene 4 — Strategy (`formula` + 路径分裂展开)

- token从中心分裂成三条路径，每条路径沿不同角度展开（duration 1.5s，`power3.inOut`，间隔0.4s）。
- 每条路径用不同色温区分：80%路径暖白、10%路径冷蓝、10%路径中性灰。
- 分裂时少量粒子（3-5个/路径）沿路径流动，`sine.inOut`。
- 公式token柔和缩放入场（scale 0.85→1 + opacity 0→1，duration 1.2s）。
- 禁止：token下落、过冲旋转、硬边高亮框。
- 转场：三条路径汇聚为"鲁棒"节点。

### Scene 5 — Why (`flow` + 对比展开)

- 左侧"全MASK"路径渐暗（opacity 1→0.3，filter brightness 0.5），右侧"混合策略"路径渐亮（opacity 0.3→1 + glow）。
- 右侧路径上有粒子沿路径流动（`sine.inOut`，duration 3s）。
- 镜头焦点从左自然切换到右（x偏移，duration 1.5s，`power2.inOut`）。
- 禁止：红色警告、故障效果、硬切对比。
- 转场：右侧路径延伸到NSP区域。

### Scene 6 — Mechanism (`process` + 结构上升)

- 句子结构从底部依次升起（y 30→0 + opacity 0→1，duration 1s，间隔0.4s，`power3.inOut`）。
- CLS节点在句子到达后被光线点亮（boxShadow 0→25px glow，duration 1.5s）。
- 连接线沿路径生长，箭头从scaleY 0→1柔和展开。
- 数据流粒子沿句子路径流入CLS（`sine.inOut`，duration 2.5s）。
- 数字跳动使用 `power2.inOut`（非 `power2.out`），duration 1s。
- 禁止：旋转入场、阶梯攀升弹跳、脉冲电流。
- 转场：CLS节点放大进入分类视图。

### Scene 7 — Controversy (`comparison` + 焦点平移)

- NSP侧逐渐暗淡（opacity 1→0.4 + glow减弱），SOP侧逐渐亮起（opacity 0.4→1 + glow增强）。
- NSP粒子缓慢消散（opacity→0 + scale→0.3，duration 2s），SOP粒子重新汇聚（duration 2s）。
- 镜头从NSP平移到SOP（x偏移，duration 1.5s，`power2.inOut`），焦点自然切换。
- 禁止：红X爆破、蓝✓故障、硬切对比、震屏。
- 转场：两节点汇聚为总结框架。

### Scene 8 — Answer (`code` + 全景知识图谱)

- 四个节点沿弧线排列，依次点亮（间隔0.5s，opacity 0→1 + glow，duration 1.2s）。
- 节点之间连线沿路径生长（scaleX/scaleY 0→1，duration 0.8s，`power2.inOut`）。
- 代码行逐步出现（clipPath inset 100%→0%，duration 1s，间隔0.5s，`power2.inOut`）。
- 镜头缓慢拉远（scale 1→0.94，duration 2.5s，`power2.inOut`），全景展示完整知识图谱。
- 粒子沿连线路径有序流动（`sine.inOut`，duration 3s）。
- 禁止：终端故障、打字机硬光标、扫描线过强。
- 转场：淡出。

## Cinematic transition catalog

All transitions must be seamless. Priority order:

1. **形态匹配转场** — 上一场景的某个元素变形为下一场景的主体。
2. **镜头连续推进** — 持续放大进入下一场景的内部空间。
3. **路径延伸** — 连接线/能量线从上一场景延伸到下一场景。
4. **粒子聚合/扩散** — 粒子重新排列形成下一场景的结构。
5. **遮罩自然覆盖** — 柔和的圆形/线性遮罩渐变覆盖。
6. **焦点平移** — 镜头水平/垂直移动到下一场景区域。

Forbidden transitions: 闪白、故障、随机旋转、硬切、闪黑。

## Camera movement rules

- 镜头只做缓慢推进（scale 0.94→1）、缓慢拉远（scale 1→0.94）、水平平移、环绕旋转（不超过半圈）。
- 所有镜头运动使用 `power2.inOut` 或 `sine.inOut`，duration ≥ 2s。
- 禁止：震屏、快速甩镜头、抖动、缩放弹跳。
- 镜头运动必须服务于信息表达，不得无意义漂移。

## Easing rules

| 用途 | 缓动函数 | 持续时间 |
| --- | --- | --- |
| 元素入场 | `power3.inOut` | 1.0-1.5s |
| 透明度渐变 | `power2.inOut` | 0.8-1.2s |
| 持续呼吸 | `sine.inOut` | 3-5s |
| 镜头运动 | `power2.inOut` | 2-2.5s |
| 连接线生长 | `power2.inOut` | 0.8-1.5s |
| 粒子流动 | `sine.inOut` | 2-4s |

Forbidden: `back.out`, `elastic.out`, `bounce`, `power4`, 任何产生过冲的缓动。

## Evidence vs. decoration

- Numbers, formulas, paper citations, complexity bounds, and pseudocode are **evidence** — they must match `sources.md` and the spoken narration exactly. Render them in Remotion layers, never as generated pixels.
- Background sweeps, ghost type, particle drift, and ring animations are **decoration** — they must never carry a factual claim. If a viewer could mistake decoration for data, lower its opacity or remove it.
- When a claim is borrowed from a paper, the citation badge must stay on screen for the full duration of that claim. Dropping the citation mid-sentence is a QA failure.
