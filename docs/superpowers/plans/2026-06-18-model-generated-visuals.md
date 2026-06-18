# Model-Generated Visuals Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an auditable model-generated image layer to every 智面引擎 production workflow with graceful motion-only fallback.

**Architecture:** An agent generates two to four images and supplies an image-map JSON. Python validates and packages assets, timeline/props carry optional image metadata, and Remotion animates the image alongside existing editorial motion templates.

**Tech Stack:** Python 3, pytest, JSON Schema, React, TypeScript, Remotion, Codex image generation.

---

## Chunk 1: Contracts and packaging

### Task 1: Define image asset behavior with failing tests

**Files:**
- Modify: `tests/test_skill_contract.py`
- Modify: `tests/test_end_to_end.py`
- Modify: `tests/test_remotion_contract.py`
- Modify: `tests/test_timeline.py`

- [ ] Add assertions for the image-generation workflow, asset output contract, optional timeline fields, Remotion component, and fallback.
- [ ] Run the focused tests and confirm they fail for the missing feature.

### Task 2: Implement deterministic image-map packaging

**Files:**
- Create: `skills/zhimian-video-studio/scripts/zhimian/images.py`
- Modify: `skills/zhimian-video-studio/scripts/run_daily.py`
- Modify: `skills/zhimian-video-studio/schemas/timeline.schema.json`

- [ ] Parse and validate an explicit `--image-map` JSON file.
- [ ] Copy valid PNG/JPEG/WebP assets into `assets/generated`.
- [ ] Write `assets/image-plan.json` and attach optional metadata to matching scenes.
- [ ] Keep a clean no-image fallback.
- [ ] Run focused Python tests and confirm they pass.

## Chunk 2: Remotion presentation

### Task 3: Add image scene rendering

**Files:**
- Create: `remotion/src/components/SceneImage.tsx`
- Modify: `remotion/src/types.ts`
- Modify: `remotion/src/components/EditorialFrame.tsx`
- Modify: `skills/zhimian-video-studio/scripts/run_daily.py`

- [ ] Map snake_case timeline image fields to camelCase Remotion props.
- [ ] Stage dated image assets under Remotion `public/generated`.
- [ ] Render images with frame-driven reveal, Ken Burns motion, editorial border, and alt text.
- [ ] Run Remotion contract tests and TypeScript typecheck.

## Chunk 3: Skill and delivery

### Task 4: Document the reusable model-image workflow

**Files:**
- Create: `skills/zhimian-video-studio/references/generative-visuals.md`
- Modify: `skills/zhimian-video-studio/SKILL.md`
- Modify: `skills/zhimian-video-studio/references/visual-system.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] Require two to four generated images by default when image generation is available.
- [ ] Document prompt, selection, safety, audit, and fallback rules.
- [ ] Preserve the default professional male narrator requirement.

### Task 5: Verify and publish

- [ ] Run the full pytest suite.
- [ ] Run Remotion typecheck.
- [ ] Run source and installed Skill validation.
- [ ] Run a dry-run with a sample image map.
- [ ] Review `git diff --check` and the intended file list.
- [ ] Commit, push the feature branch, and open a draft PR against `main`.
