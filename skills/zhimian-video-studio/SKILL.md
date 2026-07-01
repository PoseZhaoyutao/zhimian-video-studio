---
name: zhimian-video-studio
description: Use when producing or reviewing 智面引擎 daily/on-demand vertical videos, generating date-range content plans, producing a video from a user-specified topic, or packaging AI/technical-interview and industry-promotion short videos with web tutorial and experiment visuals, professional male VoxCPM2 narration, model image generation, Remotion rendering, platform copy, dated output folders, or prompts like “生成今天的视频”, “规划未来一周内容”, “指定主题生成视频”, “调用AI科普视频Skill”, and “重做今天的视频”.
---

# 智面引擎

## Overview

Produce review-ready 9:16 technical and industry-explainer short videos. Research the knowledge point and its tutorial, comparison, and experiment visuals first; retain auditable web evidence or redraw it when reuse is unclear. Generate professional male VoxCPM2 narration, measure audio, then let Remotion render `timeline.json`. Add model-generated concept images where evidence visuals do not fit.

## Quick Reference

| Need | Action |
| --- | --- |
| 生成今天的视频 | Run the dated workflow for today unless a successful date lock exists. |
| 规划未来一周/一个月内容 | Generate an editable `content-plan.json` for the requested date range, then produce from it when asked. |
| 指定主题生成视频 | Use `--topic` / user-provided title directly; do not force the fallback seed plan. |
| 调用AI科普视频Skill | Treat as manual immediate production for the current date. |
| 重做今天的视频 | Create `v2`, `v3`, etc. under the same date folder. |
| 统一音色（默认开启） | Every video conditions all segments on one synthetic male anchor; use `--no-unify-timbre` only when the user explicitly wants per-segment independent voices. |
| 自定义脚本(教程等) | Author scenes and pass `--scenes-file`; override the cover line with `--benefit`. |
| 智能生图 | Give scenes an `image_prompt` and pass `--image-gen-cmd "...{prompt}...{out}..."`; motion-only fallback on failure. |
| 网页教程/实验图 | Search in two passes, audit provenance in `research/visual-search.md`, then pass approved files through `--evidence-map`. |
| 本地视频剪辑/合成 | Write an edit plan and run `--edit-plan` (concat/crossfade/overlay/music). See `references/editing.md`. |
| 17:00 automation | Start production, update manifest stages, resume if interrupted. |
| 19:00 automation | Run QA and deliver the review package or failure report. |

## Required References

- Use `references/content-calendar.md` for content planning, plan-file structure, custom-topic routing, and fallback seed rules.
- Use `references/editorial-style.md` when writing scripts and platform copy.
- Use `references/visual-system.md` when changing cover,字幕, layout, or animation style.
- Use `references/hyperframes-motion.md` when a video should feel more dynamic, promotional, or visually expressive.
- Use `references/generative-visuals.md` when selecting scenes, prompting the image-generation tool or `--image-gen-cmd`, writing an image map, packaging generated assets, or applying the motion-only fallback.
- Use `references/evidence-visuals.md` for repeated web tutorial search, comparison and experiment figure selection, downloading, rights/provenance review, evidence-map structure, redrawing, and visual QA.
- Use `references/editing.md` when assembling multiple clips, B-roll, overlays, or a music bed via the local `--edit-plan` montage layer.
- Use `schemas/timeline.schema.json` and `schemas/manifest.schema.json` when writing structured files.

## Production Workflow

1. Read `CLAUDE.md` and the latest manifest for the date.
2. Select the topic in priority order: user-specified topic, user-provided/generated plan file, requested date-range plan, then fallback seed topic only when nothing else is provided.
3. Research with primary sources. Prefer official docs, papers, or authoritative source code. 不得伪造来源.
4. Search online tutorials plus comparison and experiment visuals in at least two materially different passes unless 2–4 admissible assets are already selected. Record queries, candidates, rejections, `source_url`, and `rights_basis` in `research/visual-search.md`. Follow `references/evidence-visuals.md`.
5. Write `script/narration.md` and `script/timeline.json` with one scene per concept. Avoid text-only pacing: each video should include at least two motion visual types such as `flow`, `comparison`, `formula`, `process`, or `code`.
6. Download or redraw approved tutorial/experiment assets, write an evidence map, and pass it with `--evidence-map`. Use visible source attribution. For remaining scenes, create 2–4 original model-generated concept images through `--image-map` or `--image-gen-cmd`. Preserve the fallback chain: self-redrawn chart → generated concept image → motion-only.
7. Plan the motion pass using `references/hyperframes-motion.md`: each scene needs a build/breathe/resolve rhythm, varied entrances, one ambient motion, and a transition that communicates the scene relationship.
8. Generate segmented narration with VoxCPM2 through `scripts/run_daily.py`; default to a professional male host/commentator voice and do not hand-roll a separate TTS path.
9. Measure each WAV duration and recalculate scene frames before rendering.
10. Render Remotion video and cover. Keep the approved cover identity stable; spend animation energy inside the video body.
11. Generate `copy/xiaohongshu.md`, `copy/douyin.md`, and `copy/bilibili.md`.
12. Run QA, including preview frames from the opening, evidence/generated-image scenes, middle scenes, and ending. 质量检查失败不得宣称成功.
13. Deliver links to video, cover, audio, evidence visuals, generated images, image plans, copy, sources, timeline, and QA report for review.

## Output Contract

Every production run writes to `outputs/YYYY-MM-DD`:

```text
outputs/YYYY-MM-DD/
├── manifest.json
├── research/sources.md
├── research/visual-search.md
├── script/narration.md
├── script/timeline.md
├── script/timeline.json
├── assets/image-plan.json
├── assets/generated/*.{png,jpg,jpeg,webp}
├── assets/evidence-visuals.json
├── assets/evidence/*.{png,jpg,jpeg,webp}
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

`timeline.json` is the source of truth for Remotion. Each scene must include: `id`, narration text, on-screen text, caption, visual type, source refs, audio file, start frame, duration in frames, and end frame. Generated-image scenes may include `image_file`, `image_alt`, and `image_prompt`. Evidence scenes also include `image_source_url`, `image_source_title`, `image_license`, `image_rights_basis`, `image_attribution`, and `image_role`. Scene duration must come from measured audio, not from guessed word count.

## Safety Boundaries

- 不得自动发布 to 小红书, B站, 抖音, or any external platform.
- 未经明确授权不得克隆真人音色; default to an AI-designed professional male narrator voice.
- 不得伪造来源, citations, benchmark claims, or API behavior.
- 质量检查失败不得宣称成功; send failed stage, logs, and existing artifacts.
- Do not use copyrighted or license-unclear images/audio as filler assets.
- Do not treat public availability as permission. Every downloaded web image must retain `source_url`, honest `rights_basis`, and visible attribution; redraw or fall back when reuse is unclear.

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
| Downloading attractive web images without provenance | Use tutorial/comparison/experiment visuals only through `assets/evidence-visuals.json`; reject decorative scraping. |

## Example

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --mode manual
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --image-map staging/image-map.json --mode manual
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --evidence-map staging/evidence-map.json --mode manual
python skills/zhimian-video-studio/scripts/run_daily.py --make-plan --plan-start 2026-07-01 --plan-days 14
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-07-03 --topic "如何用AI审查后端系统设计方案" --column "AI实操"
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --rebuild
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-18 --dry-run --skip-audio --skip-render
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-19 --topic "..." --scenes-file scenes.json --benefit "封面副标题" --unify-timbre
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-19 --scenes-file scenes.json --image-gen-cmd "python my_sd.py --prompt {prompt} --out {out}"
python skills/zhimian-video-studio/scripts/run_daily.py --edit-plan edit-plan.json --edit-output outputs/2026-06-19/video/edited-9x16.mp4
```

## Post-production and roadmap

- Unified timbre is the **default** for every video: all segments are conditioned on one synthetic male-narrator anchor (`audio/voice-anchor.wav`). Pass `--no-unify-timbre` only when the user explicitly asks for independent per-segment voices. `--scenes-file` + `--benefit` drive custom episodes (tutorials, promos) that the auto-script does not cover.
- 智能生图 is pluggable via `--image-gen-cmd` (any backend), with the motion-only fallback preserved.
- Local video editing/montage lives in `references/editing.md` (`--edit-plan`): trim, concat, crossfade, B-roll/logo overlay, and background-music mixing.
- Next on the roadmap: 口播/presenter-style narration and richer montage, both building on the editing layer above.

