# Demo 说明

仓库内置一个轻量 Demo，便于快速看风格和目录结构。

## 文件

```text
demo/
├── media/
│   ├── cover.png
│   ├── frame-30.png
│   └── fixture.mp4
└── sample-output/
    └── 2026-06-18/
        ├── manifest.json
        ├── research/sources.md
        ├── script/
        │   ├── narration.md
        │   ├── timeline.md
        │   └── timeline.json
        └── copy/
            ├── xiaohongshu.md
            ├── douyin.md
            └── bilibili.md
```

## 如何复现一个 dry-run 输出

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-06-18 `
  --output-root outputs `
  --dry-run `
  --skip-audio `
  --skip-render
```

生成结果位于：

```text
outputs/2026-06-18/
```

## 如何预览 Remotion composition

```powershell
npm install --prefix remotion
npm.cmd --prefix remotion run compositions
npm.cmd --prefix remotion run dev
```

打开 Remotion Studio 后选择：

- `ZhiMianVideo`：竖屏视频模板。
- `ZhiMianCover`：统一封面模板。

## Demo 的边界

- `demo/media/fixture.mp4` 是短渲染片段，用于确认画面风格，不代表完整 60–90 秒成片。
- `demo/sample-output` 不包含完整音频和视频，避免仓库体积过大。
- 真实生产请运行 `run_daily.py`，并让产物进入 `outputs/YYYY-MM-DD/`。
