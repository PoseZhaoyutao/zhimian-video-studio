# Model-Generated Visuals

## Default policy

Generate 2–4 original concept images per video when an image-generation tool is available. Prefer scenes where an image explains faster than text: the opening hook, an abstract mechanism, a concrete industry example, or a mistake-versus-result contrast. Do not force an image into every scene.

If image generation is unavailable or a generation fails, record the missing asset and continue with the Remotion motion-only fallback. Never block the complete video because one image is missing.

## Workflow

1. Finish research and the scene outline first.
2. Select 2–4 stable scene ids. Avoid the final CTA unless it benefits from a concrete visual.
3. Use the model's image-generation tool to create one image per selected scene. Prefer portrait or 9:16-friendly composition with important subjects centered away from edges.
4. Save PNG, JPEG, or WebP files to a local staging directory.
5. Write an image-map JSON keyed by scene id:

```json
{
  "hook": {
    "path": "D:/staging/hook.png",
    "alt": "A teacher directing an AI-assisted science video studio",
    "prompt": "Editorial concept art, a teacher directing an AI-assisted vertical video studio..."
  }
}
```

6. Run `run_daily.py --image-map <path>`. The CLI copies approved assets to `assets/generated`, writes `assets/image-plan.json`, injects metadata into `timeline.json`, and stages files for Remotion.
7. Inspect preview frames for crop, legibility, subject placement, caption overlap, visual coherence, and accidental text artifacts.

## Prompt recipe

Write prompts in this order:

1. Narrative subject and action.
2. Visual metaphor or explanatory relationship.
3. Editorial treatment: cream paper, black ink, AI blue or interview red accents.
4. Portrait-safe composition: centered subject, breathing room for overlays, no critical content near edges.
5. Restrictions: no words, no logos, no watermarks, no public figures, no copyrighted characters.

Example:

```text
Editorial concept illustration of a small-business owner directing an AI-assisted vertical video studio, the workflow visibly moving from research to narration to animated scenes, cream paper texture, black ink structure, vivid AI-blue accents, centered portrait-safe composition with clean negative space, no words, no logos, no watermark, no public figures.
```

## Selection and quality rules

- Use generated images to explain a concept, environment, transformation, or consequence.
- Keep screenshots, source diagrams, and factual charts separate; do not fabricate factual UI or data with image generation.
- Keep all readable text in Remotion, not inside the generated bitmap.
- Avoid generic glowing robots, floating brains, and random circuit backgrounds unless the subject specifically requires them.
- Preserve the same art direction across all images in one episode.
- Generated images complement `flow`, `comparison`, `formula`, `process`, and `code`; they do not replace structured explanation.

## Pluggable auto-generation (`--image-gen-cmd`)

智能生图 is a pluggable interface, not a hard-wired backend. Give each scene that should carry an image an `image_prompt` (in the `--scenes-file`), then pass a command template that knows how to turn a prompt into an image:

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-19 `
  --scenes-file scenes.json `
  --image-gen-cmd "python my_sd.py --prompt {prompt} --out {out}"
```

- `{prompt}` and `{out}` are substituted per scene; the command must write an image to `{out}`.
- Any scene whose command fails or writes nothing is skipped and recorded in `logs/image-gen.log`, then the motion-only fallback applies — image failure never blocks delivery.
- Works with any backend (local Stable Diffusion, a hosted API wrapper, an MCP shim) without changing skill code.
- An explicit `--image-map` always wins over an auto-generated entry for the same scene, so you can hand-pick a few and auto-generate the rest.

When no `--image-gen-cmd` and no `--image-map` are provided, the pipeline records `status: not_provided` and uses the motion-only fallback.

## Audit contract

`assets/image-plan.json` records each attached scene, packaged file, alt text, prompt, attached count, and the `motion-only` fallback. Keep this file with the final delivery package.
