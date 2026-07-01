# Evidence Visual Search

Use this protocol to place online tutorials, comparison results, and experimental figures into an episode without losing provenance or visual consistency.

## Search loop

1. Derive 3–6 queries from the episode's mechanism, implementation, comparison, and experiment claims.
2. Search primary papers and official documentation first; then official tutorials and repositories; use independent tutorials only when they add a clearer teaching visual.
3. Run a second, materially different query pass when the first pass lacks a useful comparison or experiment visual.
4. Stop after selecting 2–4 usable evidence visuals, or after two passes yield no new admissible candidate.
5. Write `research/visual-search.md` with queries, candidate URLs, selected/rejected status, rejection reasons, and the intended scene.

## Selection and rights

- Prefer public-domain or explicitly licensed visuals.
- Use official-documentation screenshots and short paper/tutorial excerpts only for direct commentary, with visible attribution and a source link in the package.
- Do not infer a license from public availability. Record `license: not-stated` when it is unknown and set an honest `rights_basis`.
- When reuse is unclear or the original chart is visually poor, redraw it from cited data and use `rights_basis: self-redrawn`.
- Never remove watermarks, attribution, or ownership marks. Never use scraped images as decorative filler.

Allowed `rights_basis` values:

- `licensed`
- `public-domain`
- `official-documentation`
- `paper-commentary`
- `tutorial-commentary`
- `self-redrawn`

## Evidence map

Download or redraw the approved asset locally, then write a JSON object keyed by scene id:

```json
{
  "experiment": {
    "path": "D:/staging/batchnorm-comparison.png",
    "alt": "BatchNorm and LayerNorm normalize different tensor axes",
    "source_url": "https://docs.pytorch.org/docs/stable/nn.html",
    "source_title": "PyTorch normalization documentation",
    "rights_basis": "official-documentation",
    "license": "Documentation excerpt for commentary",
    "attribution": "PyTorch documentation",
    "role": "comparison"
  }
}
```

Run:

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py --date 2026-06-11 --evidence-map staging/evidence-map.json
```

The CLI copies files to `assets/evidence/`, writes `assets/evidence-visuals.json`, and injects `source_url`, `rights_basis`, attribution, and role metadata into `timeline.json`. Evidence images take precedence over generated images only on matching scene ids.

## Visual treatment and QA

- Keep factual labels, formulas, and annotations in Remotion layers when possible.
- Crop to the relevant result; do not show an unreadable full webpage.
- Add a visible `SOURCE` label and attribution inside the scene.
- Animate with slow frame-driven pan/zoom plus a structured comparison, formula, or process layer.
- Inspect the opening, every evidence scene, and the ending for crop, resolution, attribution, caption overlap, and accidental misleading context.
- If search or reuse fails, record the reason and fall back to a self-redrawn chart, model-generated concept image, or motion-only scene.
