from __future__ import annotations

import json
import re
import shlex
import shutil
import subprocess
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
EVIDENCE_RIGHTS_BASES = {
    "licensed",
    "public-domain",
    "official-documentation",
    "paper-commentary",
    "tutorial-commentary",
    "self-redrawn",
}


def autogenerate_images(
    scenes: list[dict[str, Any]],
    image_gen_cmd: str,
    staging_dir: Path,
) -> tuple[dict[str, dict[str, str]], list[dict[str, str]]]:
    """Run a pluggable image-generation command for every scene with a prompt.

    ``image_gen_cmd`` is a command template containing ``{prompt}`` and ``{out}``
    placeholders, e.g. ``"python my_gen.py --prompt {prompt} --out {out}"``. The
    command is invoked once per scene that carries a non-empty ``image_prompt``
    (alt text falls back to ``image_alt``/``on_screen_text``). Any scene whose
    command fails or produces no file is skipped so the caller can apply the
    motion-only fallback. Returns ``(image_map, failures)`` where ``image_map``
    is keyed by scene id and ready for :func:`package_scene_images`.
    """
    # Absolute staging so downstream packaging resolves the source unambiguously.
    staging_dir = Path(staging_dir).resolve()
    staging_dir.mkdir(parents=True, exist_ok=True)
    template = [token.strip('"') for token in shlex.split(image_gen_cmd, posix=False)]

    image_map: dict[str, dict[str, str]] = {}
    failures: list[dict[str, str]] = []
    for scene in scenes:
        prompt = str(scene.get("image_prompt") or "").strip()
        if not prompt or scene.get("image_file"):
            continue
        scene_id = str(scene.get("id"))
        out = staging_dir / f"{_safe_scene_name(scene_id)}.png"
        cmd = [token.replace("{prompt}", prompt).replace("{out}", str(out)) for token in template]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        except OSError as exc:  # command not found / not executable
            failures.append({"scene_id": scene_id, "reason": f"command error: {exc}"})
            continue
        if result.returncode != 0 or not out.is_file():
            failures.append({"scene_id": scene_id, "reason": f"exit {result.returncode}, no image produced"})
            continue
        alt = str(scene.get("image_alt") or scene.get("on_screen_text") or "").strip() or scene_id
        image_map[scene_id] = {"path": str(out), "alt": alt, "prompt": prompt}
    return image_map, failures


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


def package_evidence_images(
    scenes: list[dict[str, Any]],
    evidence_map_path: Path | None,
    output_dir: Path,
) -> dict[str, Any]:
    """Package web-sourced or redrawn evidence visuals with provenance.

    Evidence images take precedence over generated images for matching scene ids.
    The caller is responsible for downloading or redrawing the approved source;
    this function keeps the local packaging step deterministic and auditable.
    """

    manifest_path = output_dir / "assets" / "evidence-visuals.json"
    if evidence_map_path is None:
        report: dict[str, Any] = {
            "status": "not_provided",
            "requested_count": 0,
            "attached_count": 0,
            "entries": [],
            "fallback": "generated-image-or-motion-only",
        }
        _write_json(manifest_path, report)
        return report

    evidence_map_path = evidence_map_path.expanduser().resolve()
    if not evidence_map_path.is_file():
        raise FileNotFoundError(evidence_map_path)
    payload = json.loads(evidence_map_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("evidence map must be a JSON object keyed by scene id")

    scenes_by_id = {str(scene.get("id")): scene for scene in scenes}
    unknown = sorted(set(map(str, payload)) - set(scenes_by_id))
    if unknown:
        raise ValueError(f"evidence map contains unknown scene id(s): {', '.join(unknown)}")

    evidence_dir = output_dir / "assets" / "evidence"
    entries: list[dict[str, Any]] = []
    for scene_id, raw_entry in payload.items():
        if not isinstance(raw_entry, dict):
            raise ValueError(f"evidence map entry {scene_id!r} must be an object")

        source_value = raw_entry.get("path")
        if not isinstance(source_value, str) or not source_value.strip():
            raise ValueError(f"evidence map entry {scene_id!r} requires path")
        source = Path(source_value).expanduser()
        if not source.is_absolute():
            source = evidence_map_path.parent / source
        source = source.resolve()
        if not source.is_file():
            raise FileNotFoundError(source)
        extension = source.suffix.lower()
        if extension not in SUPPORTED_IMAGE_EXTENSIONS:
            raise ValueError("evidence images must be PNG, JPEG, or WebP")

        required_text = ("alt", "source_url", "source_title", "rights_basis")
        values = {key: str(raw_entry.get(key) or "").strip() for key in required_text}
        for key, value in values.items():
            if not value:
                raise ValueError(f"evidence map entry {scene_id!r} requires {key}")
        parsed = urlparse(values["source_url"])
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError(f"evidence map entry {scene_id!r} source_url must use http or https")
        if values["rights_basis"] not in EVIDENCE_RIGHTS_BASES:
            allowed = ", ".join(sorted(EVIDENCE_RIGHTS_BASES))
            raise ValueError(f"evidence map entry {scene_id!r} rights_basis must be one of: {allowed}")

        license_text = str(raw_entry.get("license") or "not-stated").strip()
        attribution = str(raw_entry.get("attribution") or values["source_title"]).strip()
        role = str(raw_entry.get("role") or "tutorial").strip()

        evidence_dir.mkdir(parents=True, exist_ok=True)
        destination = evidence_dir / f"{_safe_scene_name(str(scene_id))}{extension}"
        shutil.copy2(source, destination)
        relative = destination.relative_to(output_dir).as_posix()
        scene = scenes_by_id[str(scene_id)]
        scene.update(
            image_file=relative,
            image_alt=values["alt"],
            image_source_url=values["source_url"],
            image_source_title=values["source_title"],
            image_license=license_text,
            image_rights_basis=values["rights_basis"],
            image_attribution=attribution,
            image_role=role,
        )
        entries.append(
            {
                "scene_id": str(scene_id),
                "status": "ready",
                "file": relative,
                "alt": values["alt"],
                "source_url": values["source_url"],
                "source_title": values["source_title"],
                "license": license_text,
                "rights_basis": values["rights_basis"],
                "attribution": attribution,
                "role": role,
            }
        )

    report = {
        "status": "ready" if entries else "not_provided",
        "requested_count": len(payload),
        "attached_count": len(entries),
        "entries": entries,
        "fallback": "generated-image-or-motion-only",
    }
    _write_json(manifest_path, report)
    return report
