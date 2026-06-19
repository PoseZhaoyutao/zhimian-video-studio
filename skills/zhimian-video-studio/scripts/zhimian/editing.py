"""Local, deterministic video editing/montage for 智面引擎.

A thin, ffmpeg-backed montage layer that assembles already-rendered Remotion
clips (and optional B-roll, overlays, and background music) into one delivery
video. It is intentionally separate from the audio-driven Remotion render: the
main pipeline still owns scene rendering and burned-in captions; this module
owns post-production assembly (trim, concat, crossfade, overlay, music mix).

Everything is driven by an edit plan (a JSON-able dict) so an edit is
reproducible and reviewable, matching the rest of the skill's contract.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class EditSpec:
    width: int = 1080
    height: int = 1920
    fps: int = 30
    sample_rate: int = 48_000


def _run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True, text=True, encoding="utf-8")


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nokey=1:noprint_wrappers=1", str(path)],
        check=True, capture_output=True, text=True, encoding="utf-8",
    )
    return float(result.stdout.strip())


def _has_audio(path: Path) -> bool:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
         "stream=index", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True, encoding="utf-8",
    )
    return bool(result.stdout.strip())


def normalize_clip(src: Path, out: Path, spec: EditSpec, start: float | None = None, end: float | None = None) -> Path:
    """Re-encode one clip to a uniform size/fps/audio so clips can be joined."""
    out.parent.mkdir(parents=True, exist_ok=True)
    vf = (
        f"scale={spec.width}:{spec.height}:force_original_aspect_ratio=decrease,"
        f"pad={spec.width}:{spec.height}:(ow-iw)/2:(oh-ih)/2:color=black,"
        f"setsar=1,fps={spec.fps},format=yuv420p"
    )
    cmd = ["ffmpeg", "-nostdin", "-y", "-loglevel", "error"]
    if start is not None:
        cmd += ["-ss", str(start)]
    if end is not None:
        cmd += ["-to", str(end)]
    cmd += ["-i", str(src)]
    if not _has_audio(src):
        cmd += ["-f", "lavfi", "-t", "0.1", "-i", f"anullsrc=r={spec.sample_rate}:cl=stereo", "-shortest"]
    cmd += [
        "-vf", vf,
        "-af", f"aformat=sample_rates={spec.sample_rate}:channel_layouts=stereo",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(spec.fps),
        "-c:a", "aac", "-ar", str(spec.sample_rate),
        str(out),
    ]
    _run(cmd)
    return out


def crossfade_pair(a: Path, b: Path, out: Path, duration: float, spec: EditSpec) -> Path:
    """Crossfade clip b onto the end of clip a (video xfade + audio acrossfade)."""
    out.parent.mkdir(parents=True, exist_ok=True)
    offset = max(0.0, probe_duration(a) - duration)
    filtergraph = (
        f"[0:v][1:v]xfade=transition=fade:duration={duration}:offset={offset}[v];"
        f"[0:a][1:a]acrossfade=d={duration}[a]"
    )
    _run([
        "ffmpeg", "-nostdin", "-y", "-loglevel", "error",
        "-i", str(a), "-i", str(b),
        "-filter_complex", filtergraph, "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(spec.fps),
        "-c:a", "aac", "-ar", str(spec.sample_rate), str(out),
    ])
    return out


def concat_clips(paths: list[Path], out: Path, spec: EditSpec) -> Path:
    """Hard-cut concat of already-normalized clips via the concat demuxer."""
    out.parent.mkdir(parents=True, exist_ok=True)
    listing = out.with_suffix(".concat.txt")
    listing.write_text("".join(f"file '{p.as_posix()}'\n" for p in paths), encoding="utf-8")
    _run([
        "ffmpeg", "-nostdin", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(listing),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(spec.fps),
        "-c:a", "aac", "-ar", str(spec.sample_rate), str(out),
    ])
    listing.unlink(missing_ok=True)
    return out


def overlay_image(video: Path, image: Path, out: Path, spec: EditSpec,
                  start: float = 0.0, end: float | None = None,
                  x: str = "W-w-40", y: str = "40", scale: float = 0.25) -> Path:
    """Overlay a B-roll/logo image on the video for a time window."""
    out.parent.mkdir(parents=True, exist_ok=True)
    enable = f":enable='between(t,{start},{end})'" if end is not None else ""
    w = int(spec.width * scale)
    filtergraph = f"[1:v]scale={w}:-1[ov];[0:v][ov]overlay={x}:{y}{enable}[v]"
    _run([
        "ffmpeg", "-nostdin", "-y", "-loglevel", "error",
        "-i", str(video), "-i", str(image),
        "-filter_complex", filtergraph, "-map", "[v]", "-map", "0:a?",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(spec.fps),
        "-c:a", "aac", "-ar", str(spec.sample_rate), str(out),
    ])
    return out


def mix_background_music(video: Path, music: Path, out: Path, spec: EditSpec, gain_db: float = -18.0) -> Path:
    """Mix looping background music under the existing narration track."""
    out.parent.mkdir(parents=True, exist_ok=True)
    duration = probe_duration(video)
    filtergraph = (
        f"[1:a]volume={gain_db}dB,aloop=loop=-1:size=2e9,atrim=0:{duration},asetpts=N/SR/TB[bg];"
        f"[0:a][bg]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]"
    )
    _run([
        "ffmpeg", "-nostdin", "-y", "-loglevel", "error",
        "-i", str(video), "-i", str(music),
        "-filter_complex", filtergraph, "-map", "0:v", "-map", "[a]",
        "-c:v", "copy", "-c:a", "aac", "-ar", str(spec.sample_rate), str(out),
    ])
    return out


def render_edit(plan: dict[str, Any], output: Path, *, work_dir: Path | None = None) -> Path:
    """Assemble an edit plan into one delivery video.

    Plan schema (all but ``clips`` optional)::

        {
          "width": 1080, "height": 1920, "fps": 30,
          "clips": [
            {"src": "a.mp4", "start": 0, "end": null, "transition": "cut"},
            {"src": "b.mp4", "transition": "crossfade", "transition_duration": 0.5}
          ],
          "overlays": [{"image": "logo.png", "start": 0, "end": 2, "scale": 0.2}],
          "background_music": {"src": "bgm.mp3", "gain_db": -18}
        }
    """
    clips = plan.get("clips") or []
    if not clips:
        raise ValueError("edit plan requires a non-empty 'clips' list")
    spec = EditSpec(
        width=int(plan.get("width", 1080)),
        height=int(plan.get("height", 1920)),
        fps=int(plan.get("fps", 30)),
        sample_rate=int(plan.get("sample_rate", 48_000)),
    )
    base = Path(plan.get("_base_dir", ".")).resolve()

    def _resolve(value: str) -> Path:
        p = Path(value).expanduser()
        return p if p.is_absolute() else (base / p)

    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    owns_work = work_dir is None
    work_dir = Path(work_dir) if work_dir else Path(tempfile.mkdtemp(prefix="zhimian-edit-"))
    try:
        normalized: list[Path] = []
        for index, clip in enumerate(clips):
            src = _resolve(str(clip["src"]))
            if not src.is_file():
                raise FileNotFoundError(src)
            normalized.append(
                normalize_clip(src, work_dir / f"norm-{index:02d}.mp4", spec,
                               start=clip.get("start"), end=clip.get("end"))
            )

        acc = normalized[0]
        for index, clip in enumerate(clips[1:], start=1):
            transition = str(clip.get("transition", "cut")).lower()
            if transition in {"crossfade", "fade"}:
                duration = float(clip.get("transition_duration", 0.5))
                acc = crossfade_pair(acc, normalized[index], work_dir / f"xf-{index:02d}.mp4", duration, spec)
            else:
                acc = concat_clips([acc, normalized[index]], work_dir / f"cat-{index:02d}.mp4", spec)

        for index, overlay in enumerate(plan.get("overlays", [])):
            acc = overlay_image(
                acc, _resolve(str(overlay["image"])), work_dir / f"ov-{index:02d}.mp4", spec,
                start=float(overlay.get("start", 0.0)),
                end=overlay.get("end"),
                x=str(overlay.get("x", "W-w-40")),
                y=str(overlay.get("y", "40")),
                scale=float(overlay.get("scale", 0.25)),
            )

        music = plan.get("background_music")
        if music:
            acc = mix_background_music(
                acc, _resolve(str(music["src"])), work_dir / "bgm.mp4", spec,
                gain_db=float(music.get("gain_db", -18.0)),
            )

        shutil.copy2(acc, output)
        return output
    finally:
        if owns_work:
            shutil.rmtree(work_dir, ignore_errors=True)


def load_edit_plan(path: Path) -> dict[str, Any]:
    path = Path(path)
    plan = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(plan, dict):
        raise ValueError("edit plan must be a JSON object")
    plan.setdefault("_base_dir", str(path.resolve().parent))
    return plan
