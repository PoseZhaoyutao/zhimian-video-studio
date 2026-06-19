# Demo

这里保存智面引擎的轻量演示资产。

- `media/cover.png`：统一封面风格预览。
- `media/frame-30.png`：视频第 30 帧预览。
- `media/fixture.mp4`：短 Remotion 渲染片段。
- `sample-output/2026-06-18/`：一次 dry-run 的核心输出结构。
- `edit-plan.example.json`：本地剪辑层的示例计划（拼接 + 交叉淡入）。

体验本地视频剪辑（`references/editing.md`）：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --edit-plan demo/edit-plan.example.json `
  --edit-output demo/edited-demo.mp4
```

真实生产产物不会提交到仓库，请运行：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --dry-run `
  --skip-audio `
  --skip-render
```

或在配置 VoxCPM2 和 Remotion 后运行真实生产命令。
