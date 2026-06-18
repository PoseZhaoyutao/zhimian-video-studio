# 智面引擎 · ZhiMian Video Studio

> 一个面向“AI 使用技巧 × 大厂技术面试拆招”的本地优先短视频生产 Skill：从选题、脚本、VoxCPM2 配音、Remotion 竖屏动画、封面、平台文案到 QA 审核包，按日期沉淀为可复查的内容资产。

![智面引擎封面预览](demo/media/cover.png)

## 为什么做它

技术内容账号最难的不是“今天发什么”，而是每天稳定产出一条可信、可复查、风格统一的视频。智面引擎把这个流程做成 Codex Skill + Remotion 工程 + VoxCPM2 配音适配器：

- 内容定位：大厂面试技术细节、AI/算法、后端、系统设计、AI 实操方法。
- 内容规划：既能先生成某个时间段的 `content-plan.json`，也能直接指定一个主题立刻生产。
- 视频形态：统一 9:16 竖屏，适配小红书、抖音、B站竖屏。
- 动画表达：Remotion 时间轴支持流程流动、左右对比、公式揭示、代码卡片和动态背景，不只是文字翻页。
- 生产节奏：支持 17:00 自动生产、19:00 审核交付，也支持手动立即触发。
- 输出资产：每次生产落到 `outputs/YYYY-MM-DD/`，保留视频、封面、配音、文案、来源、时间轴、QA 报告。
- 安全边界：默认合成技术讲解音色；不自动发布；不伪造来源；不做未经授权的真人声音克隆。

## Demo

- 封面预览：[`demo/media/cover.png`](demo/media/cover.png)
- 动画预览帧：[`demo/media/frame-30.png`](demo/media/frame-30.png)
- Remotion 短片段：[`demo/media/fixture.mp4`](demo/media/fixture.mp4)
- 示例输出包：[`demo/sample-output/2026-06-18/`](demo/sample-output/2026-06-18/)

示例输出包展示了真实生产目录的核心结构：`manifest.json`、`script/timeline.json`、三平台文案、来源占位和分镜脚本。仓库不内置完整日更视频大文件，实际内容由本机命令生成到 `outputs/`。

## 30 秒快速开始

```powershell
git clone https://github.com/PoseZhaoyutao/zhimian-video-studio.git zhimian-video-studio
cd zhimian-video-studio

python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

npm install --prefix remotion

python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --dry-run `
  --skip-audio `
  --skip-render
```

上面的命令会生成一个离线审核包，不调用 VoxCPM2，也不启动真实视频渲染，适合先验证目录结构和文案链路。

## 真实生产命令

准备好 VoxCPM2 和 Remotion 依赖后，运行：

```powershell
$env:ZHIMIAN_REPO_ROOT = (Get-Location).Path
$env:VOXCPM2_PROJECT = "D:\Project\VoxCPM2\VoxCPM"

python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --mode manual
```

先生成一份可编辑的时间段内容规划：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --make-plan `
  --plan-start 2026-07-01 `
  --plan-days 14 `
  --plan-theme "AI工具与技术面试" `
  --plan-output plans
```

按规划文件生成某一天：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-07-03 `
  --plan-file plans/2026-07-01_to_2026-07-14/content-plan.json `
  --output-root outputs `
  --mode manual
```

也可以直接指定主题，不走默认选题：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-07-03 `
  --topic "如何用AI审查后端系统设计方案" `
  --column "AI实操" `
  --output-root outputs `
  --mode manual
```

重做当天内容并保留旧版本：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --mode manual `
  --rebuild
```

> 当前实现会先生成 VoxCPM2 分段 WAV，再把分段音频复制到 Remotion `public/generated/YYYY-MM-DD/`，写出 `script/remotion-props.json`，最后渲染 `video/final-9x16.mp4` 和 `cover/cover-9x16.png`。

## 输出目录

```text
outputs/YYYY-MM-DD/
├── manifest.json
├── research/sources.md
├── script/narration.md
├── script/timeline.md
├── script/timeline.json
├── script/remotion-props.json
├── audio/segments/*.wav
├── audio/narration.wav
├── video/final-9x16.mp4
├── cover/cover-9x16.png
├── copy/xiaohongshu.md
├── copy/douyin.md
├── copy/bilibili.md
├── qa/report.json
└── logs/production.log
```

## 架构

```mermaid
flowchart LR
  A["内容规划 / 指定主题"] --> B["脚本与分镜"]
  B --> C["VoxCPM2 分段配音"]
  C --> D["音频时长测量"]
  D --> E["timeline.json"]
  E --> F["Remotion props"]
  C --> F
  F --> G["竖屏动画视频 + 封面"]
  E --> H["平台文案"]
  G --> I["QA 审核包"]
  H --> I
```

核心文件：

| 路径 | 作用 |
| --- | --- |
| `skills/zhimian-video-studio/SKILL.md` | Codex Skill 入口，定义触发词、工作流和安全边界。 |
| `skills/zhimian-video-studio/references/content-calendar.md` | 内容规划协议：时间段计划、指定主题、兜底种子。 |
| `skills/zhimian-video-studio/scripts/run_daily.py` | 日更/手动生产 CLI，也支持 `--make-plan`、`--topic`、`--plan-file`。 |
| `skills/zhimian-video-studio/scripts/zhimian/planner.py` | 内容规划、规划文件读取和自定义选题推断。 |
| `skills/zhimian-video-studio/scripts/zhimian/vox.py` | VoxCPM2 适配器。 |
| `remotion/` | React/Remotion 竖屏视频、封面和可复用动作模板。 |
| `tests/` | Skill、CLI、时间轴、VoxCPM2 适配器、QA 契约测试。 |

## 安装方式

如果你只是想跑完整生产仓库，请看 [安装教程](docs/INSTALL.md)。

如果你要把它作为 Codex Skill 安装到本机：

```powershell
$repo = "D:\Project\StudentsVideo\zhimian-video-studio"
$target = "$env:USERPROFILE\.codex\skills\zhimian-video-studio"

New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
Copy-Item -Recurse -Force "$repo\skills\zhimian-video-studio" $target

$env:ZHIMIAN_REPO_ROOT = $repo
```

安装后，在 Codex 里说“调用智面引擎”“规划未来一周内容”“指定主题生成视频”“生成今天的视频”“重做今天的视频”，Skill 会按 `SKILL.md` 的生产流程执行。因为 Remotion 工程在仓库根目录，建议长期把 `ZHIMIAN_REPO_ROOT` 写进 PowerShell profile 或系统环境变量。

## VoxCPM2 教程

详见 [VoxCPM2 本地配音教程](docs/VOXCPM2.md)。最小配置如下：

```powershell
$env:VOXCPM2_PROJECT = "D:\Project\VoxCPM2\VoxCPM"
$env:VOXCPM2_MODEL_SOURCE = "openbmb/VoxCPM2"
$env:VOXCPM2_VOICE_PROMPT = "清晰、中性、轻快、技术讲解感，停顿自然"
```

默认策略是“AI 设计合成音色”。如果要使用参考音频做真人声线克隆，必须显式传入授权参数；当前适配器会拒绝未授权的 voice clone。

## 验证

```powershell
pytest -q
npm.cmd --prefix remotion run typecheck
npm.cmd --prefix remotion run compositions
```

Skill 格式校验：

```powershell
$env:PYTHONUTF8 = "1"
python C:\Users\admin\.codex\skills\.system\skill-creator\scripts\quick_validate.py `
  skills/zhimian-video-studio
```

## 平台文案策略

同一条视频会生成三份文案，但不会简单复制：

- 小红书：收藏感、笔记感、标签密度更高。
- 抖音：更短的钩子、更强互动问题。
- B站：标题更解释型，描述更适合学习复盘。

## 内容原则

智面引擎不是“背面经”的流水线。每期内容必须能回答：

1. 面试官到底在问什么？
2. 底层原理是什么？
3. 追问链会怎么展开？
4. 高分回答如何组织？
5. 哪些地方容易答错或被继续追问？

## 自动化建议

本仓库支持 CLI 级手动调用；在 Codex 桌面端可配合每日 17:00/19:00 heartbeat 自动化：

- 17:00：生产当天审核包。
- 19:00：读取 QA 和产物，向当前线程交付审核链接。

自动化只做生产和审核提醒，不自动发布到小红书、抖音或 B站。

## 文档

- [安装教程](docs/INSTALL.md)
- [VoxCPM2 本地配音教程](docs/VOXCPM2.md)
- [Demo 说明](docs/DEMO.md)
- [设计规格](docs/superpowers/specs/2026-06-18-zhimian-video-studio-design.md)
- [验证记录](docs/verification/2026-06-18-zhimian-verification.md)

## 许可证

当前仓库未附带开源许可证。公开发布前建议明确选择 MIT、Apache-2.0 或私有闭源策略。
