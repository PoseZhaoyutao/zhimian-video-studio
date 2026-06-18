# 安装教程

本文面向两类使用方式：

1. 作为完整视频生产仓库运行：推荐方式，包含 Remotion 工程、测试、Demo 和 Skill。
2. 作为 Codex Skill 安装：适合在 Codex 对话中用“生成今天的视频”触发。

## 环境要求

- Windows 10/11 或兼容的 PowerShell 环境。
- Python 3.11+。
- Node.js 20+ 与 npm。
- Git。
- 可选：本地 VoxCPM2 工程，默认路径为 `D:\Project\VoxCPM2\VoxCPM`。

## 克隆仓库

```powershell
git clone https://github.com/PoseZhaoyutao/zhimian-video-studio.git zhimian-video-studio
cd zhimian-video-studio
```

如果你是从本地复制得到仓库，只要确保当前目录包含：

```text
skills/zhimian-video-studio/
remotion/
tests/
README.md
```

## Python 依赖

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`requirements.txt` 只包含生产脚本和测试需要的最小依赖。VoxCPM2 自身依赖请按 `docs/VOXCPM2.md` 安装。

## Remotion 依赖

```powershell
npm install --prefix remotion
```

验证 Remotion 工程：

```powershell
npm.cmd --prefix remotion run typecheck
npm.cmd --prefix remotion run compositions
```

应该能看到 `ZhiMianVideo` 和 `ZhiMianCover` 两个 composition。

## 离线 dry-run

不调用 VoxCPM2，不渲染真实视频，只验证生产目录、脚本、时间轴、文案和 QA：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --dry-run `
  --skip-audio `
  --skip-render
```

输出目录：

```text
outputs/2026-06-18/
```

## 真实生产

先设置仓库根目录和 VoxCPM2 路径：

```powershell
$env:ZHIMIAN_REPO_ROOT = (Get-Location).Path
$env:VOXCPM2_PROJECT = "D:\Project\VoxCPM2\VoxCPM"
```

再运行：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --mode manual
```

## 内容规划与指定主题

生成一段时间的内容规划草稿：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --make-plan `
  --plan-start 2026-07-01 `
  --plan-days 14 `
  --plan-theme "AI工具与技术面试" `
  --plan-output plans
```

使用规划文件生产某天内容：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-07-03 `
  --plan-file plans/2026-07-01_to_2026-07-14/content-plan.json `
  --output-root outputs `
  --mode manual
```

直接指定主题生产：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-07-03 `
  --topic "如何用AI审查后端系统设计方案" `
  --column "AI实操" `
  --output-root outputs `
  --mode manual
```

这些入口都会走同一条音频驱动流程。Remotion 渲染层会根据 `timeline.json` 的 `visual_type` 选择流程、对比、公式、代码等动作模板，避免纯文字翻页。

如果当天已经有成功产物，命令会复用日期锁。需要重做时加 `--rebuild`：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --mode manual `
  --rebuild
```

## 安装为 Codex Skill

完整仓库仍然保留在某个固定路径，例如：

```powershell
$repo = "D:\Project\StudentsVideo\zhimian-video-studio"
```

复制 Skill 本体：

```powershell
$target = "$env:USERPROFILE\.codex\skills\zhimian-video-studio"
New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
Copy-Item -Recurse -Force "$repo\skills\zhimian-video-studio" $target
```

设置根目录环境变量，让 Skill 能找到仓库根目录下的 `remotion/`：

```powershell
$env:ZHIMIAN_REPO_ROOT = $repo
```

建议写入 PowerShell profile：

```powershell
notepad $PROFILE
```

加入：

```powershell
$env:ZHIMIAN_REPO_ROOT = "D:\Project\StudentsVideo\zhimian-video-studio"
$env:VOXCPM2_PROJECT = "D:\Project\VoxCPM2\VoxCPM"
```

## 常见问题

### 中文输出乱码

Windows 终端可临时设置：

```powershell
$env:PYTHONUTF8 = "1"
chcp 65001
```

### 找不到 Remotion CLI

确认已安装依赖：

```powershell
npm install --prefix remotion
```

并确认存在：

```powershell
Test-Path remotion\node_modules\.bin\remotion.cmd
```

### VoxCPM2 很慢

当前本地环境如果是 CPU-only，短句也可能需要几十秒。优先检查 PyTorch 是否识别 CUDA；如果没有 GPU，建议先用 `--skip-audio` 做脚本和画面调试。
