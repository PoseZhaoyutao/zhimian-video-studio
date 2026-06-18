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

