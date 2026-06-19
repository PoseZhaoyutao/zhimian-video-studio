# Local Video Editing / Montage

A local, deterministic post-production layer (`scripts/zhimian/editing.py`, ffmpeg-backed) that assembles already-rendered clips into one delivery video. It is **separate from** the audio-driven Remotion render: Remotion still owns scene rendering and burned-in captions; this module owns assembly — trim, concat, crossfade, B-roll/logo overlay, and background-music mixing.

Use it when an episode is more than a single Remotion composition: stitching an intro/outro, joining several rendered segments, dropping in real screen-recording B-roll, or laying a music bed under the narration.

## Run it

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py --edit-plan edit-plan.json --edit-output outputs/2026-06-19/video/edited-9x16.mp4
```

`--edit-plan` is a standalone mode (like `--make-plan`); it does not run the daily production.

## Edit plan schema

```json
{
  "width": 1080, "height": 1920, "fps": 30,
  "clips": [
    { "src": "intro.mp4", "start": 0, "end": null, "transition": "cut" },
    { "src": "body-9x16.mp4", "transition": "crossfade", "transition_duration": 0.5 },
    { "src": "broll.mp4", "start": 2, "end": 7, "transition": "crossfade" }
  ],
  "overlays": [
    { "image": "logo.png", "start": 0, "end": 3, "x": "W-w-40", "y": "40", "scale": 0.18 }
  ],
  "background_music": { "src": "bed.mp3", "gain_db": -18 }
}
```

- **clips** (required): each is trimmed (`start`/`end`, seconds) and normalized to `width×height@fps` with stereo audio (silent audio is synthesized if a clip has none). `transition` is `cut` (default) or `crossfade`/`fade` with `transition_duration` seconds.
- **overlays** (optional): a B-roll/logo image composited for a time window; `x`/`y` accept ffmpeg overlay expressions, `scale` is a fraction of frame width.
- **background_music** (optional): looped, trimmed to length, attenuated by `gain_db`, and mixed under the existing narration.

Relative `src`/`image` paths resolve against the plan file's directory.

## Determinism & boundaries

- One plan → one reproducible output; keep the plan with the delivery for audit.
- The module re-encodes (libx264 + AAC, yuv420p, SAR 1) so mixed-source clips join cleanly.
- It does **not** fabricate content; it only assembles assets you provide.
- Captions stay in Remotion (burned at render time); the editor does not add CJK subtitle burn-in.

## Roadmap

口播 / presenter-style narration and richer montage (beat-synced cuts, auto B-roll selection) build on this module next; the plan schema is the stable contract those will extend.
