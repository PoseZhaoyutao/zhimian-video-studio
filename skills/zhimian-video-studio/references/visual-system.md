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
- Do not produce a video that is only text cards. Each production should include at least two motion templates:
  - `flow`: steps connected by an animated line or moving signal.
  - `comparison`: two options/cards enter separately, then the stronger answer wins.
  - `formula`: concepts reveal as tokens and the final mental model is highlighted.
  - `process`: numbered steps appear sequentially.
  - `code`: technical follow-up or pseudo-code reveals as a card.
- Background motion should be subtle: low-opacity shapes, sweeps, pulses, or particles that guide attention without competing with captions.

