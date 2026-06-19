import shutil
import subprocess
from pathlib import Path

import pytest

from zhimian.editing import probe_duration, render_edit

pytestmark = pytest.mark.skipif(
    shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None,
    reason="ffmpeg/ffprobe not available",
)


def _make_clip(path: Path, color: str, seconds: float = 2.0) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-loglevel", "error",
         "-f", "lavfi", "-i", f"color=c={color}:s=320x240:d={seconds}:r=30",
         "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", str(path)],
        check=True, capture_output=True, text=True,
    )
    return path


def _streams(path: Path) -> set[str]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type",
         "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout
    return set(out.split())


def test_render_edit_cut_concat(tmp_path: Path):
    a = _make_clip(tmp_path / "a.mp4", "red")
    b = _make_clip(tmp_path / "b.mp4", "blue")
    plan = {"width": 320, "height": 240, "fps": 30,
            "clips": [{"src": str(a)}, {"src": str(b), "transition": "cut"}]}
    out = render_edit(plan, tmp_path / "out.mp4")

    assert out.is_file()
    assert {"video", "audio"} <= _streams(out)
    assert abs(probe_duration(out) - 4.0) < 0.4


def test_render_edit_crossfade_shortens_total(tmp_path: Path):
    a = _make_clip(tmp_path / "a.mp4", "red")
    b = _make_clip(tmp_path / "b.mp4", "green")
    plan = {"width": 320, "height": 240, "fps": 30,
            "clips": [{"src": str(a)},
                      {"src": str(b), "transition": "crossfade", "transition_duration": 0.5}]}
    out = render_edit(plan, tmp_path / "xf.mp4")

    # 2 + 2 - 0.5 overlap
    assert abs(probe_duration(out) - 3.5) < 0.4


def test_render_edit_with_background_music(tmp_path: Path):
    a = _make_clip(tmp_path / "a.mp4", "red")
    music = _make_clip(tmp_path / "m.mp4", "black", seconds=1.0)
    plan = {"width": 320, "height": 240, "fps": 30,
            "clips": [{"src": str(a)}],
            "background_music": {"src": str(music), "gain_db": -18}}
    out = render_edit(plan, tmp_path / "bgm.mp4")

    assert {"video", "audio"} <= _streams(out)
    assert abs(probe_duration(out) - 2.0) < 0.4


def test_render_edit_requires_clips(tmp_path: Path):
    with pytest.raises(ValueError):
        render_edit({"clips": []}, tmp_path / "x.mp4")
