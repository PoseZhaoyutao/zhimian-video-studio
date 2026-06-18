# HyperFrames Motion Pass for 智面引擎

Use HyperFrames as the motion-design grammar while Remotion remains the final renderer and audio-driven timeline owner.

## Scene rhythm

Every scene follows three phases:

1. **Build (0–30%)** — reveal the headline first, then the visual payload with staggered entrances.
2. **Breathe (30–70%)** — keep the content readable and use one ambient motion only.
3. **Resolve (70–100%)** — hold the completed idea; the next scene's transition performs the visual exit.

## Required motion layers

Each scene should contain at least three visual layers:

- Background: oversized ghost type, an orbit, sweep, rail, or subtle geometric drift.
- Foreground: flow, comparison, formula, process, code, or editorial content.
- Accent: marker sweep, underline, burst, cursor, scan, pulse, or progress motion.

## Entrance variety

- Do not enter every element from below.
- Alternate left/right translation, scale, clipped reveal, rotation, and opacity-only entrances.
- Use faster motion for accents and slower motion for heavy headline/card elements.
- Stagger by narrative importance, not DOM order.

## Transitions

- Use an editorial push/wipe as the primary transition.
- Use the transition to hide the scene cut; do not empty the outgoing scene first.
- Keep transitions short enough that the first spoken idea still lands within three seconds.
- Use the same primary transition for consistency; reserve stronger accents for a topic change or final reveal.

## Motion typography

- Reveal headlines with clipped masks or directional movement.
- Add a deterministic marker sweep, underline, burst, or sketch accent to the key phrase.
- Keep body text readable for its full spoken interval; animation must not reduce reading time.

## Remotion mapping

| HyperFrames concept | Remotion implementation |
| --- | --- |
| `gsap.from()` entrance | `spring()` or `interpolate()` from hidden/off-position to the CSS end state |
| Marker sweep | `scaleX()` driven by frames |
| Push transition | Full-frame `SceneWipe` overlay at the beginning of the incoming scene |
| Ambient timeline | Deterministic `Math.sin()` / frame interpolation inside `MotionBackdrop` |
| Typewriter/cursor | Frame-derived character count and finite cursor blink |
| Stagger | Offset each item's frame passed into `spring()` |

Do not use CSS transitions, CSS animations, random values, infinite loops, or time-based browser state. The rendered frame number is the only clock.
