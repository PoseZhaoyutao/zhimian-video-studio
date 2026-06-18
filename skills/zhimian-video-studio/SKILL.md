---
name: zhimian-video-studio
description: Use when producing or reviewing 智面引擎 daily/on-demand vertical videos, generating date-range content plans, producing a video from a user-specified topic, or packaging AI/technical-interview and industry-promotion short videos with professional male VoxCPM2 narration, model image generation, Remotion rendering, HyperFrames-inspired motion choreography, platform copy, dated output folders, or prompts like “生成今天的视频”, “规划未来一周内容”, “指定主题生成视频”, “调用AI科普视频Skill”, and “重做今天的视频”.
---

# 智面引擎

## Overview

Produce review-ready 9:16 technical and industry-explainer short videos. The core rule is audio-driven production: research and script first, generate professional male VoxCPM2 narration, measure audio, then let Remotion render `timeline.json` into the final package. Add 2–4 original model-generated concept images through the available image-generation tool, and apply HyperFrames motion principles without replacing the Remotion timing/output contract.

## Quick Reference

| Need | Action |
| --- | --- |
| 生成今天的视频 | Run the dated workflow for today unless a successful date lock exists. |
| 规划未来一周/一个月内容 | Generate an editable `content-plan.json` for the requested date range, then produce from it when asked. |
| 指定主题生成视频 | Use `--topic` / user-provided title directly; do not force the fallback seed plan. |
| 调用AI科普视频Skill | Treat as manual immediate production for the current date. |
| 重做今天的视频 | Create `v2`, `v3`, etc. under the same date folder. |
| 17:00 automation | Start production, update manifest stages, resume if interrupted. |
| 19:00 automation | Run QA and deliver the review package or failure report. |

## Required References

- Use `references/content-calendar.md` for content planning, plan-file structure, custom-topic routing, and fallback seed rules.
- Use `references/editorial-style.md` when writing scripts and platform copy.
- Use `references/visual-system.md` when changing cover,字幕, layout, or animation style.
- Use `references/hyperframes-motion.md` when a video should feel more dynamic, promotional, or visually expressive.
- Use `references/generative-visuals.md` when selecting scenes, prompting the image-generation tool, writing an image map, packaging generated assets, or applying the motion-only fallback.
- Use `schemas/timeline.schema.json` and `schemas/manifest.schema.json` when writing structured files.

## Production Workflow

1. Read `CLAUDE.md` and the latest manifest for the date.
2. Select the topic in priority order: user-specified topic, user-provided/generated plan file, requested date-range plan, then fallback seed topic only when nothing else is provided.
3. Research with primary sources. Prefer official docs, papers, or authoritative source code. 不得伪造来源.
4. Write `script/narration.md` and `script/timeline.json` with one scene per concept. Avoid text-only pacing: each video should include at least two motion visual types such as `flow`, `comparison`, `formula`, `process`, or `code`.
5. Select 2–4 high-value scenes and use the available image-generation tool to create original concept images. Write an image-map JSON with scene id, local path, alt text, and prompt; pass it with `--image-map`. If generation is unavailable or fails, record it and use the motion-only fallback without blocking delivery.
6. Plan the motion pass using `references/hyperframes-motion.md`: each scene needs a build/breathe/resolve rhythm, varied entrances, one ambient motion, and a transition that communicates the scene relationship.
7. Generate segmented narration with VoxCPM2 through `scripts/run_daily.py`; default to a professional male host/commentator voice and do not hand-roll a separate TTS path.
8. Measure each WAV duration and recalculate scene frames before rendering.
9. Render Remotion video and cover. Keep the approved cover identity stable; spend animation energy inside the video body.
10. Generate `copy/xiaohongshu.md`, `copy/douyin.md`, and `copy/bilibili.md`.
11. Run QA, including preview frames from the opening, generated-image scenes, middle scenes, and ending. 质量检查失败不得宣称成功.
12. Deliver links to video, cover, audio, generated images, image plan, copy, sources, timeline, and QA report for review.

## Output Contract

Every production run writes to `outputs/YYYY-MM-DD`:

```text
outputs/YYYY-MM-DD/
├── manifest.json
├── research/sources.md
├── script/narration.md
├── script/timeline.md
├── script/timeline.json
├── assets/image-plan.json
├── assets/generated/*.{png,jpg,jpeg,webp}
├── audio/segments/*.wav
├── audio/narration.wav
├── video/final-9x16.mp4
├── cover/cover-9x16.png
├── copy/xiaohongshu.md
├── copy/douyin.md
├── copy/bilibili.md
├── qa/report.json
├── qa/preview-frames/*.png
└── logs/production.log
```

Rebuilds use `outputs/YYYY-MM-DD/v2`, `v3`, and keep previous versions.

## Timeline Contract

`timeline.json` is the source of truth for Remotion. Each scene must include: `id`, narration text, on-screen text, caption, visual type, source refs, audio file, start frame, duration in frames, and end frame. Generated-image scenes may also include `image_file`, `image_alt`, and `image_prompt`. Scene duration must come from measured audio, not from guessed word count.

## Safety Boundaries

- 不得自动发布 to 小红书, B站, 抖音, or any external platform.
- 未经明确授权不得克隆真人音色; default to an AI-designed professional male narrator voice.
- 不得伪造来源, citations, benchmark claims, or API behavior.
- 质量检查失败不得宣称成功; send failed stage, logs, and existing artifacts.
- Do not use copyrighted or license-unclear images/audio as filler assets.
- Do not silently replace failed model generation with scraped web images; preserve the motion-only fallback.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Writing a generic职场话术 video | Use technical follow-up chains: 原题 → 原理 → 追问 → 高分回答. |
| Hard-coding scene lengths | Generate VoxCPM2 audio first, then compute frames. |
| Making platform copy identical | Same video, different title/tag/description strategy. |
| Silent failure before 19:00 | Send partial package and precise failure report. |
| Random cover style | Use the C-style editorial tokens from `visual-system.md`. |
| Treating fallback seeds as a fixed first-month calendar | Generate or load a date-range content plan when the user asks for planning. |
| Making a video that is only moving text | Use timeline-driven motion templates: flow, comparison, formula, process, and code. |
| Adding decorative motion with no narrative role | Use HyperFrames-derived build/breathe/resolve choreography and meaningful scene wipes; motion must direct attention. |
| Using the same entrance and background movement everywhere | Vary direction, speed, easing character, and ambient motion by scene type. |
| Filling every scene with text despite image generation being available | Generate 2–4 concept images for the hook, abstract principle, example, or contrast scenes. |
| Turning generated images into a static slideshow | Animate them inside Remotion and retain diagrams, captions, and meaningful transitions. |

## Example

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --mode manual
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --image-map staging/image-map.json --mode manual
python skills/zhimian-video-studio/scripts/run_daily.py --make-plan --plan-start 2026-07-01 --plan-days 14
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-07-03 --topic "如何用AI审查后端系统设计方案" --column "AI实操"
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --rebuild
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --dry-run --skip-audio --skip-render
```

