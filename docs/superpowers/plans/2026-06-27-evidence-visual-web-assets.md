# Evidence Visual Web Assets Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add auditable web tutorial, comparison, and experiment visuals to the ZhiMian production workflow.

**Architecture:** Keep web discovery agent-mediated and make local packaging deterministic. A new evidence-map contract validates downloaded files and provenance, injects them into the audio-driven timeline, and reuses the existing Remotion image renderer.

**Tech Stack:** Python, pytest, JSON, Remotion/React, Markdown Skill references.

---

## Chunk 1: Evidence asset contract

### Task 1: Package evidence images

**Files:**
- Create: `tests/test_evidence_images.py`
- Modify: `skills/zhimian-video-studio/scripts/zhimian/images.py`

- [ ] Write failing tests for valid packaging, provenance injection, unknown scenes, invalid URLs, and missing rights metadata.
- [ ] Run `pytest tests/test_evidence_images.py -q` and confirm the missing API failure.
- [ ] Implement `package_evidence_images()` with strict local-file and provenance validation.
- [ ] Re-run the targeted tests and keep existing image tests green.

### Task 2: Wire the CLI and QA

**Files:**
- Modify: `tests/test_end_to_end.py`
- Modify: `tests/test_qa.py`
- Modify: `skills/zhimian-video-studio/scripts/run_daily.py`
- Modify: `skills/zhimian-video-studio/scripts/zhimian/qa.py`
- Modify: `skills/zhimian-video-studio/schemas/timeline.schema.json`

- [ ] Add failing CLI and QA tests for `--evidence-map`.
- [ ] Run the tests and confirm expected failures.
- [ ] Add the CLI flag, evidence precedence, timeline fields, and QA validation.
- [ ] Re-run targeted tests.

## Chunk 2: Skill behavior and deployment

### Task 3: Document the search loop

**Files:**
- Create: `skills/zhimian-video-studio/references/evidence-visuals.md`
- Modify: `skills/zhimian-video-studio/SKILL.md`
- Modify: `skills/zhimian-video-studio/references/visual-system.md`
- Modify: `tests/test_skill_contract.py`

- [ ] Add a failing contract test for the new protocol and output files.
- [ ] Write the minimal reusable evidence-search reference.
- [ ] Update the Skill workflow, output contract, safety rules, and common mistakes.
- [ ] Validate the Skill and run the complete pytest suite.
- [ ] Synchronize the verified Skill to the global Codex Skill directory.

## Chunk 3: Five-episode production

### Task 4: Research and stage 11–15 June

**Files:**
- Create per-date scene, source, visual-search, and evidence-map inputs under `batch-runs/`.
- Produce under `outputs/2026-06-11` through `outputs/2026-06-15`.

- [ ] Verify technical claims from primary sources.
- [ ] Search tutorials and experiment/comparison visuals; record candidates and rights basis.
- [ ] Download or redraw selected visuals and build evidence maps.
- [ ] Write detailed episode scenes and platform-specific copy.

### Task 5: Generate, render, and verify

- [ ] Run VoxCPM2 with unified synthetic male timbre for each episode.
- [ ] Render Remotion video and cover from measured audio durations.
- [ ] Run independent ffprobe and preview-frame QA.
- [ ] Repair only failed stages and re-run checks.
- [ ] Update `CLAUDE.md` with verified results and deliver artifact links.
