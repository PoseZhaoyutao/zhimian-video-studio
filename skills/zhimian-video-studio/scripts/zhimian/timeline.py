from __future__ import annotations

import math
from collections.abc import Iterable, Mapping
from typing import Any


def finalize_timeline(
    scenes: Iterable[Mapping[str, Any]],
    *,
    fps: int,
    scene_padding: float = 0.0,
) -> list[dict[str, Any]]:
    if fps <= 0:
        raise ValueError("fps must be positive")
    if scene_padding < 0:
        raise ValueError("scene_padding must be non-negative")

    finalized: list[dict[str, Any]] = []
    start_frame = 0
    for index, source in enumerate(scenes):
        scene = dict(source)
        if not scene.get("id"):
            raise ValueError(f"scene {index} requires id")
        if not scene.get("narration"):
            raise ValueError(f"scene {scene['id']} requires narration")
        duration = float(scene.get("audio_duration", 0))
        if duration <= 0:
            raise ValueError(f"scene {scene['id']} audio_duration must be positive")

        duration_in_frames = math.ceil((duration + scene_padding) * fps)
        end_frame = start_frame + duration_in_frames
        scene.update(
            start_frame=start_frame,
            duration_in_frames=duration_in_frames,
            end_frame=end_frame,
            start_seconds=start_frame / fps,
            end_seconds=end_frame / fps,
        )
        finalized.append(scene)
        start_frame = end_frame
    return finalized
