from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any, Callable


MediaProbe = Callable[[Path], dict[str, Any]]


REQUIRED_FILES = (
    "script/timeline.json",
    "research/sources.md",
    "copy/xiaohongshu.md",
    "copy/douyin.md",
    "copy/bilibili.md",
    "video/final-9x16.mp4",
    "cover/cover-9x16.png",
)


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def probe_media(path: Path) -> dict[str, Any]:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_streams",
            "-show_format",
            str(path),
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    payload = json.loads(result.stdout)
    video = next((stream for stream in payload.get("streams", []) if stream.get("codec_type") == "video"), {})
    audio = any(stream.get("codec_type") == "audio" for stream in payload.get("streams", []))
    fps_text = video.get("avg_frame_rate") or "0/1"
    numerator, denominator = [float(part) for part in fps_text.split("/", 1)]
    return {
        "width": int(video.get("width", 0)),
        "height": int(video.get("height", 0)),
        "fps": numerator / denominator if denominator else 0,
        "duration": float(payload.get("format", {}).get("duration", 0)),
        "has_audio": audio,
    }


def run_qa(output_dir: Path | str, *, media_probe: MediaProbe = probe_media) -> dict[str, Any]:
    root = Path(output_dir)
    failures: list[str] = []

    for relative in REQUIRED_FILES:
        path = root / relative
        if not path.exists() or path.stat().st_size == 0:
            failures.append(f"missing required file: {relative}")

    timeline_path = root / "script" / "timeline.json"
    if timeline_path.exists():
        timeline = _read_json(timeline_path)
        for scene in timeline.get("scenes", []):
            if not scene.get("source_refs"):
                failures.append(f"scene {scene.get('id', '<unknown>')} missing source_refs")

    sources_path = root / "research" / "sources.md"
    if sources_path.exists() and not sources_path.read_text(encoding="utf-8").strip():
        failures.append("sources.md is empty")

    video_path = root / "video" / "final-9x16.mp4"
    if video_path.exists() and video_path.stat().st_size > 0:
        try:
            meta = media_probe(video_path)
        except Exception as exc:  # pragma: no cover - exact ffprobe errors vary
            failures.append(f"media probe failed: {exc}")
        else:
            if (meta.get("width"), meta.get("height")) != (1080, 1920):
                failures.append("video must be 1080x1920")
            if abs(float(meta.get("fps", 0)) - 30) > 0.01:
                failures.append("video fps must be 30")
            duration = float(meta.get("duration", 0))
            if duration < 60 or duration > 90:
                failures.append("video duration must be 60-90 seconds")
            if not meta.get("has_audio"):
                failures.append("video must contain audio")

    report = {"passed": not failures, "failures": failures}
    report_path = root / "qa" / "report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report
