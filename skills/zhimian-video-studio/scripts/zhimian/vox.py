from __future__ import annotations

import os
import sys
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import numpy as np


DEFAULT_VOICE_PROMPT = os.environ.get(
    "VOXCPM2_VOICE_PROMPT",
    "温文尔雅的男性解说主播，声音温暖醇厚，语速适中从容不迫，吐字清晰自然，"
    "带有学者气质，娓娓道来而不急不躁，适合深度科普与知识分享",
)
DEFAULT_MODEL_SOURCE = os.environ.get("VOXCPM2_MODEL_SOURCE", "openbmb/VoxCPM2")
DEFAULT_PROJECT_PATH = Path(os.environ.get("VOXCPM2_PROJECT", r"D:\Project\VoxCPM2\VoxCPM"))


@dataclass(frozen=True)
class AudioSegment:
    path: Path
    duration_seconds: float
    sample_rate: int


def _wav_info(path: Path) -> tuple[int, float]:
    with wave.open(str(path), "rb") as audio:
        sample_rate = audio.getframerate()
        duration = audio.getnframes() / sample_rate
    return sample_rate, duration


def _write_pcm16_wav(path: Path, samples: Any, sample_rate: int) -> None:
    array = np.asarray(samples, dtype=np.float32).reshape(-1)
    array = np.clip(array, -1.0, 1.0)
    pcm = (array * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(pcm.tobytes())


def _ffmpeg_denoise(src: Path, dst: Path) -> bool:
    """ffmpeg post-process: gentle denoise + deess + dynaudnorm + warm EQ.

    v4: lowered afftdn strength to avoid musical-noise artifacts (the
    "water-drop / hiss" perceived as residual noise), swapped hard
    compressor for dynaudnorm (more natural leveling), added deesser for
    sibilance, and rolled off harsh 6 kHz region so the voice sounds
    温文尔雅 instead of bright/hard.

    Returns True on success, False if ffmpeg is unavailable.
    """
    import shutil as _sh
    import subprocess as _sp
    if not _sh.which("ffmpeg"):
        return False
    try:
        af = (
            "highpass=f=100,"
            "lowpass=f=7500,"
            "afftdn=nr=8:nf=-25,"
            "deesser=i=0.4,"
            "dynaudnorm=p=0.85:g=101:f=250,"
            "equalizer=f=3000:width_type=h:width=1200:g=2,"
            "equalizer=f=200:width_type=h:width=150:g=-2,"
            "equalizer=f=6000:width_type=h:width=2000:g=-2,"
            "volume=1.2dB"
        )
        _sp.run(
            ["ffmpeg", "-nostdin", "-y", "-loglevel", "error",
             "-i", str(src), "-af", af, "-ar", str(_wav_info(src)[0]),
             str(dst)],
            check=True, capture_output=True, text=True, encoding="utf-8",
        )
        return True
    except _sp.CalledProcessError:
        try:
            _sp.run(
                ["ffmpeg", "-nostdin", "-y", "-loglevel", "error",
                 "-i", str(src), "-ar", str(_wav_info(src)[0]), str(dst)],
                check=True, capture_output=True, text=True, encoding="utf-8",
            )
            return True
        except _sp.CalledProcessError:
            return False


def _load_model(source: str, project_path: Path | None = None) -> Any:
    if project_path:
        source_dir = project_path / "src"
        if source_dir.is_dir() and str(source_dir) not in sys.path:
            sys.path.insert(0, str(source_dir))
    from voxcpm import VoxCPM

    return VoxCPM.from_pretrained(source, load_denoiser=True)


class VoxAdapter:
    def __init__(
        self,
        *,
        model_source: str = DEFAULT_MODEL_SOURCE,
        project_path: Path | str | None = DEFAULT_PROJECT_PATH,
        voice_prompt: str = DEFAULT_VOICE_PROMPT,
        cfg_value: float = 2.0,
        inference_timesteps: int = 10,
        model_loader: Callable[[str], Any] | None = None,
        reference_audio: Path | str | None = None,
        authorized_voice_clone: bool = False,
    ) -> None:
        self.model_source = model_source
        self.project_path = Path(project_path) if project_path else None
        self.voice_prompt = voice_prompt
        self.cfg_value = cfg_value
        self.inference_timesteps = inference_timesteps
        self.reference_audio = Path(reference_audio) if reference_audio else None
        self.authorized_voice_clone = authorized_voice_clone
        self._model_loader = model_loader
        self._model: Any | None = None

    def _get_model(self) -> Any:
        if self._model is None:
            if self._model_loader:
                self._model = self._model_loader(self.model_source)
            else:
                self._model = _load_model(self.model_source, self.project_path)
        return self._model

    def _generation_kwargs(self, text: str) -> dict[str, Any]:
        if self.reference_audio:
            if not self.authorized_voice_clone:
                raise PermissionError("voice clone requires explicit authorization")
            if not self.reference_audio.is_file():
                raise FileNotFoundError(self.reference_audio)
            generated_text = text
            reference = {"reference_wav_path": str(self.reference_audio)}
        else:
            generated_text = f"({self.voice_prompt}){text}"
            reference = {}
        return {
            "text": generated_text,
            "cfg_value": self.cfg_value,
            "inference_timesteps": self.inference_timesteps,
            **reference,
        }

    def generate_segments(
        self,
        texts: list[str],
        output_dir: Path | str,
    ) -> list[AudioSegment]:
        if self.reference_audio and not self.authorized_voice_clone:
            raise PermissionError("voice clone requires explicit authorization")

        destination = Path(output_dir)
        destination.mkdir(parents=True, exist_ok=True)
        results: list[AudioSegment] = []
        model = None

        for index, text in enumerate(texts, start=1):
            path = destination / f"{index:02d}.wav"
            if path.exists() and path.stat().st_size > 0:
                sample_rate, duration = _wav_info(path)
                results.append(AudioSegment(path, duration, sample_rate))
                continue

            if not text.strip():
                raise ValueError(f"segment {index} text must not be empty")
            model = model or self._get_model()
            samples = model.generate(**self._generation_kwargs(text))
            sample_rate = int(model.tts_model.sample_rate)
            temporary = path.with_name(f"{path.stem}.tmp.wav")
            _write_pcm16_wav(temporary, samples, sample_rate)
            # ffmpeg post-process denoise for cleaner audio
            denoised = path.with_name(f"{path.stem}.denoised.wav")
            if _ffmpeg_denoise(temporary, denoised):
                os.replace(denoised, path)
                temporary.unlink(missing_ok=True)
            else:
                os.replace(temporary, path)
            results.append(AudioSegment(path, len(samples) / sample_rate, sample_rate))
        return results
