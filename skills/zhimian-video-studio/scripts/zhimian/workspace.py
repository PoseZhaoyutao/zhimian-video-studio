from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any


REQUIRED_DIRECTORIES = (
    "research",
    "script",
    "audio/segments",
    "video",
    "cover",
    "copy",
    "qa/preview-frames",
    "logs",
)


def _validate_date(value: str) -> str:
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("date must use YYYY-MM-DD") from exc
    if parsed.isoformat() != value:
        raise ValueError("date must use YYYY-MM-DD")
    return value


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, path)


@dataclass
class RunWorkspace:
    output_dir: Path
    run_date: str
    version: int
    reused: bool = False

    @property
    def manifest_path(self) -> Path:
        return self.output_dir / "manifest.json"

    def update_manifest(self, **changes: Any) -> dict[str, Any]:
        manifest = _read_json(self.manifest_path)
        manifest.update(changes)
        manifest["updated_at"] = datetime.now(timezone.utc).isoformat()
        _write_json_atomic(self.manifest_path, manifest)
        return manifest

    def mark_success(self) -> None:
        self.update_manifest(status="success")


def _next_version(date_root: Path) -> int:
    versions = [1] if date_root.exists() else []
    if date_root.exists():
        for child in date_root.iterdir():
            if child.is_dir() and child.name.startswith("v") and child.name[1:].isdigit():
                versions.append(int(child.name[1:]))
    return max(versions, default=1) + 1


def prepare_run(outputs_root: Path | str, run_date: str, rebuild: bool) -> RunWorkspace:
    run_date = _validate_date(run_date)
    root = Path(outputs_root)
    date_root = root / run_date
    root_manifest = date_root / "manifest.json"

    if not rebuild and _read_json(root_manifest).get("status") == "success":
        return RunWorkspace(date_root, run_date, version=1, reused=True)

    version = _next_version(date_root) if rebuild else 1
    output_dir = date_root if version == 1 else date_root / f"v{version}"
    for relative in REQUIRED_DIRECTORIES:
        (output_dir / relative).mkdir(parents=True, exist_ok=True)

    workspace = RunWorkspace(output_dir, run_date, version=version)
    if not workspace.manifest_path.exists():
        workspace.update_manifest(
            schema_version=1,
            date=run_date,
            version=version,
            status="in_progress",
            stage="planned",
        )
    return workspace
