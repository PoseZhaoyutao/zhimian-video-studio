# 智面引擎 Visual System

## Brand Tokens

- Background: `#F4EFE4`
- Ink: `#151515`
- Interview red: `#E83F32`
- AI blue: `#265CFF`
- Muted text: `#817B72`

## Layout

- Video: 1080×1920, 30fps, 60–90 seconds.
- Cover: label, three-line headline, benefit sentence, episode number.
- Safe margins: keep text away from app UI and captions.
- Opening: no long logo intro; enter the technical question within three seconds.

## Motion Rules

- Use `useCurrentFrame()`, `interpolate()`, and `spring()`.
- Do not use CSS transitions, CSS animations, or Tailwind animation classes.
- One concept per scene. Use process animation when explaining calculations or data flow.
- Use red for interview/alert/failure concepts; blue for AI/process/tool concepts.
- Treat HyperFrames as the motion-design grammar and Remotion as the final deterministic renderer. Follow `hyperframes-motion.md`.
- Every scene needs a build/breathe/resolve rhythm, an entrance for every major element, and a transition-led handoff.
- Use at least three layers per scene: ambient background, foreground concept visual, and an accent such as marker sweep, burst, cursor, scan, or pulse.
- Vary entrance direction, duration, and easing character by scene. Repeating the same rise-and-fade pattern is a QA failure.
- Preserve the approved cover composition unless the user explicitly requests a cover redesign.
- Generate 2–4 original concept images per episode when model image generation is available. Follow `generative-visuals.md` for scene selection, prompting, audit metadata, and fallback.
- Present generated images inside the editorial system: ink border, cream/black framing, category accent, purposeful crop, slow frame-driven camera motion, and readable captions outside the bitmap.
- Keep factual text, labels, formulas, and data in Remotion layers. Generated pixels must not be the source of factual claims.
- Do not produce a video that is only text cards. Each production should include at least two motion templates:
  - `flow`: steps connected by an animated line or moving signal.
  - `comparison`: two options/cards enter separately, then the stronger answer wins.
  - `formula`: concepts reveal as tokens and the final mental model is highlighted.
  - `process`: numbered steps appear sequentially.
  - `code`: technical follow-up or pseudo-code reveals as a card.
- Background motion should be subtle: low-opacity shapes, sweeps, pulses, or particles that guide attention without competing with captions.

