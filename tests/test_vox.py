from pathlib import Path

import numpy as np

from zhimian.vox import DEFAULT_VOICE_PROMPT, VoxAdapter


class FakeModel:
    class TTS:
        sample_rate = 16_000

    tts_model = TTS()

    def __init__(self):
        self.calls = []

    def generate(self, **kwargs):
        self.calls.append(kwargs)
        return np.zeros(1_600, dtype=np.float32)


def test_model_is_loaded_once_and_segments_are_written(tmp_path: Path):
    loads = []
    model = FakeModel()
    adapter = VoxAdapter(model_loader=lambda _: loads.append(1) or model)

    outputs = adapter.generate_segments(["第一段", "第二段"], tmp_path)

    assert loads == [1]
    assert len(outputs) == 2
    assert all(item.path.exists() for item in outputs)
    assert all(item.duration_seconds == 0.1 for item in outputs)
    assert model.calls[0]["text"] == f"({DEFAULT_VOICE_PROMPT})第一段"
    assert model.calls[0]["cfg_value"] == 2.0
    assert model.calls[0]["inference_timesteps"] == 10


def test_existing_non_empty_segment_is_reused(tmp_path: Path):
    model = FakeModel()
    adapter = VoxAdapter(model_loader=lambda _: model)
    first = adapter.generate_segments(["第一段"], tmp_path)
    second = adapter.generate_segments(["改写不会覆盖"], tmp_path)

    assert second[0].path == first[0].path
    assert len(model.calls) == 1


def test_voice_clone_requires_explicit_authorization(tmp_path: Path):
    reference = tmp_path / "person.wav"
    reference.write_bytes(b"not-used")
    adapter = VoxAdapter(
        model_loader=lambda _: FakeModel(),
        reference_audio=reference,
        authorized_voice_clone=False,
    )

    try:
        adapter.generate_segments(["不得克隆"], tmp_path / "out")
    except PermissionError as exc:
        assert "authorization" in str(exc).lower()
    else:
        raise AssertionError("unauthorized voice clone must be rejected")
