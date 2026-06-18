# Model-Generated Visuals Design

## Goal

Make every 智面引擎 video visually richer by default with two to four model-generated concept images, while keeping Remotion motion graphics, captions, and local VoxCPM2 narration as the deterministic production backbone.

## Approved behavior

- Select two to four high-value scenes per episode: normally the hook, an abstract principle, a concrete example, or a contrast/mistake scene.
- Generate original 9:16-friendly concept art with the available model image-generation tool before rendering.
- Treat images as visual evidence or explanation, not decorative filler. Do not render text, logos, public figures, or copyrighted characters into generated images.
- Preserve the established cream/black/red-or-blue editorial identity by giving images a consistent crop, border, mask, motion, and accent treatment inside Remotion.
- Continue rendering diagram, process, formula, code, and caption layers. Generated images complement these layers instead of replacing the whole scene with a slideshow.
- If image generation is unavailable or fails, record the reason and continue with the existing Remotion motion template. A missing image must not block narration, render, or delivery.

## Architecture

The model-generation call remains agent-mediated because Remotion and the Python CLI cannot directly invoke the Codex image-generation tool. The agent creates an image-map JSON whose entries contain a stable scene id, local image path, alt text, and the prompt used. `run_daily.py` validates and copies those assets into the dated package, records an auditable `assets/image-plan.json`, injects optional image metadata into `timeline.json`, and stages the images into Remotion's public directory.

Remotion receives optional `imageFile`, `imageAlt`, and `imagePrompt` scene properties. A frame-driven `SceneImage` component applies editorial framing, a slow Ken Burns move, masked reveal, depth shadow, and accent details. Scenes without an image follow the existing visual-template path unchanged.

## Data contract

Input image map:

```json
{
  "hook": {
    "path": "C:/temp/hook.png",
    "alt": "A creator directing an AI-assisted vertical video studio",
    "prompt": "Editorial concept art ..."
  }
}
```

Output additions:

```text
outputs/YYYY-MM-DD/
└── assets/
    ├── image-plan.json
    └── generated/<scene-id>.<ext>
```

Each matching timeline scene may include `image_file`, `image_alt`, and `image_prompt`. Remotion props expose the camelCase equivalents.

## Safety and failure handling

- Accept only existing PNG, JPEG, or WebP files from the explicit image map.
- Sanitize scene ids before creating destination filenames.
- Keep prompts and alt text in the audit package.
- Never silently substitute web images or license-unclear assets.
- Record missing/invalid generation results as skipped entries and use the motion-only scene.

## Verification

- Python contract tests cover image-map loading, validation, copying, timeline injection, and no-image fallback.
- Remotion contract tests cover prop mapping and the frame-driven image component.
- End-to-end dry-run testing verifies the dated asset package and image plan.
- TypeScript typecheck and Skill validation must pass before publication.
