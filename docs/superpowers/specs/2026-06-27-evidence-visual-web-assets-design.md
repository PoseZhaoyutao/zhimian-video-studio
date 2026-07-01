# Evidence Visual Web Assets Design

## Goal

Upgrade `zhimian-video-studio` so every episode searches for relevant online tutorials, comparison results, and experimental figures, then places suitable evidence visuals into the Remotion timeline with source and rights metadata.

## Accepted direction

Use an agent-mediated search loop rather than an embedded crawler. The producing agent can use current web-search and browser tools, while the local CLI remains deterministic and receives approved local files through `--evidence-map`.

## Search loop

For each episode, search in this order:

1. Primary papers and official framework/model documentation.
2. Official tutorials and repository documentation.
3. High-quality explanatory tutorials only when they add a clearer comparison or experiment.

Continue until at least two useful evidence candidates are found or two materially different search passes return no new usable asset. Record queries, candidates, rejection reasons, and selected assets in `research/visual-search.md`.

## Rights and provenance

Every downloaded visual must retain `source_url`, `source_title`, `rights_basis`, attribution, and its instructional role. Prefer openly licensed/public-domain assets. Official screenshots and short paper/tutorial excerpts may only be used for source-specific commentary with visible attribution. If reuse is unclear, redraw the chart from cited data or replace it with a model-generated concept image; never silently treat an unknown-license image as reusable.

## Data flow

1. The agent researches the episode and downloads approved PNG/JPEG/WebP assets to staging.
2. The agent writes an evidence map keyed by stable scene id.
3. `run_daily.py --evidence-map` validates and copies files to `assets/evidence/`.
4. Evidence metadata is injected into `timeline.json`; evidence images override generated concept images only for matching scenes.
5. Remotion stages the selected image and applies the existing editorial crop and frame-driven motion.
6. QA validates that packaged evidence files and provenance fields exist.

## Output additions

- `research/visual-search.md`
- `assets/evidence-visuals.json`
- `assets/evidence/*.{png,jpg,jpeg,webp}`
- Timeline metadata: `image_source_url`, `image_source_title`, `image_license`, `image_rights_basis`, `image_attribution`, and `image_role`.

## Failure behavior

Search, download, licensing, or crop failure must be recorded. The episode falls back in order to a self-redrawn chart, model-generated concept image, then motion-only Remotion visuals. Evidence-visual failure does not block audio or rendering, but malformed supplied evidence metadata is a QA failure.

## Acceptance checks

- A valid evidence map packages a web asset and injects provenance into the scene.
- Unknown scenes, unsafe file types, invalid URLs, and missing rights metadata are rejected.
- The CLI supports `--evidence-map` without breaking `--image-map`.
- QA catches missing evidence files or provenance.
- The Skill requires the search loop and references the evidence-visual protocol.
- Five requested episodes include an auditable visual-search record and use evidence visuals where suitable.
