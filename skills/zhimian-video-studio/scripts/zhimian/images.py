from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from typing import Any


SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _safe_scene_name(scene_id: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9._-]+", "-", scene_id).strip("-.")
    if not safe:
        raise ValueError(f"scene id {scene_id!r} cannot be used as an image filename")
    return safe


def package_scene_images(
    scenes: list[dict[str, Any]],
    image_map_path: Path | None,
    output_dir: Path,
) -> dict[str, Any]:
    """Validate and copy agent-generated scene images into the dated package."""

    plan_path = output_dir / "assets" / "image-plan.json"
    if image_map_path is None:
        report: dict[str, Any] = {
            "status": "not_provided",
            "requested_count": 0,
            "attached_count": 0,
            "entries": [],
            "fallback": "motion-only",
        }
        _write_json(plan_path, report)
        return report

    image_map_path = image_map_path.expanduser().resolve()
    if not image_map_path.is_file():
        raise FileNotFoundError(image_map_path)
    payload = json.loads(image_map_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("image map must be a JSON object keyed by scene id")

    scenes_by_id = {str(scene.get("id")): scene for scene in scenes}
    unknown = sorted(set(map(str, payload)) - set(scenes_by_id))
    if unknown:
        raise ValueError(f"image map contains unknown scene id(s): {', '.join(unknown)}")

    generated_dir = output_dir / "assets" / "generated"
    entries: list[dict[str, Any]] = []
    for scene_id, raw_entry in payload.items():
        if not isinstance(raw_entry, dict):
            raise ValueError(f"image map entry {scene_id!r} must be an object")
        source_value = raw_entry.get("path")
        if not isinstance(source_value, str) or not source_value.strip():
            raise ValueError(f"image map entry {scene_id!r} requires path")
        source = Path(source_value).expanduser()
        if not source.is_absolute():
            source = image_map_path.parent / source
        source = source.resolve()
        if not source.is_file():
            raise FileNotFoundError(source)
        extension = source.suffix.lower()
        if extension not in SUPPORTED_IMAGE_EXTENSIONS:
            raise ValueError("generated images must be PNG, JPEG, or WebP")

        alt = str(raw_entry.get("alt") or "").strip()
        prompt = str(raw_entry.get("prompt") or "").strip()
        if not alt or not prompt:
            raise ValueError(f"image map entry {scene_id!r} requires alt and prompt")

        generated_dir.mkdir(parents=True, exist_ok=True)
        destination = generated_dir / f"{_safe_scene_name(str(scene_id))}{extension}"
        shutil.copy2(source, destination)
        relative = destination.relative_to(output_dir).as_posix()
        scene = scenes_by_id[str(scene_id)]
        scene.update(
            image_file=relative,
            image_alt=alt,
            image_prompt=prompt,
        )
        entries.append(
            {
                "scene_id": str(scene_id),
                "status": "ready",
                "file": relative,
                "alt": alt,
                "prompt": prompt,
            }
        )

    report = {
        "status": "ready" if entries else "not_provided",
        "requested_count": len(payload),
        "attached_count": len(entries),
        "entries": entries,
        "fallback": "motion-only",
    }
    _write_json(plan_path, report)
    return report
