import struct
import wave
from pathlib import Path

import run_daily


class _FakeSegment:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.duration_seconds = 1.0
        self.sample_rate = 16_000


class _FakeAdapter:
    instances: list["_FakeAdapter"] = []

    def __init__(self, **kwargs) -> None:
        self.kwargs = kwargs
        _FakeAdapter.instances.append(self)

    def generate_segments(self, texts, output_dir):
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)
        results = []
        for index, _text in enumerate(texts, start=1):
            path = out / f"{index:02d}.wav"
            with wave.open(str(path), "wb") as audio:
                audio.setnchannels(1)
                audio.setsampwidth(2)
                audio.setframerate(16_000)
                audio.writeframes(struct.pack("<h", 0) * 1_600)
            results.append(_FakeSegment(path))
        return results


def test_unify_timbre_flag_defaults_to_false():
    args = run_daily.build_parser().parse_args(["--date", "2026-06-18"])
    assert args.unify_timbre is False
    args = run_daily.build_parser().parse_args(["--date", "2026-06-18", "--unify-timbre"])
    assert args.unify_timbre is True


def test_ensure_voice_anchor_creates_then_reuses(tmp_path: Path, monkeypatch):
    _FakeAdapter.instances.clear()
    monkeypatch.setattr(run_daily, "VoxAdapter", _FakeAdapter)

    anchor = run_daily._ensure_voice_anchor(tmp_path)

    assert anchor == tmp_path / "audio" / "voice-anchor.wav"
    assert anchor.exists() and anchor.stat().st_size > 0
    # The single anchor utterance is the default professional male voice (prompt-only).
    assert _FakeAdapter.instances[-1].kwargs == {}
    # Staging directory is cleaned up after minting the anchor.
    assert not (tmp_path / "audio" / "_anchor").exists()

    minted = len(_FakeAdapter.instances)
    again = run_daily._ensure_voice_anchor(tmp_path)
    assert again == anchor
    # A second call reuses the existing clip instead of generating a new one.
    assert len(_FakeAdapter.instances) == minted
