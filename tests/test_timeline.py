import json
from pathlib import Path

from zhimian.timeline import finalize_timeline


ROOT = Path(__file__).parents[1]
SCHEMA_DIR = ROOT / "skills" / "zhimian-video-studio" / "schemas"


def test_audio_duration_drives_frames_and_scene_starts():
    scenes = [
        {"id": "hook", "narration": "问题", "audio_duration": 2.5},
        {"id": "explain", "narration": "解释", "audio_duration": 7.25},
    ]

    result = finalize_timeline(scenes, fps=30, scene_padding=0.1)

    assert result[0]["start_frame"] == 0
    assert result[0]["duration_in_frames"] == 78
    assert result[1]["start_frame"] == 78
    assert result[1]["duration_in_frames"] == 221
    assert result[1]["end_frame"] == 299


def test_timeline_rejects_non_positive_audio_duration():
    try:
        finalize_timeline(
            [{"id": "hook", "narration": "问题", "audio_duration": 0}],
            fps=30,
        )
    except ValueError as exc:
        assert "audio_duration" in str(exc)
    else:
        raise AssertionError("zero duration must be rejected")


def test_timeline_and_manifest_schemas_require_core_fields():
    timeline_schema = json.loads(
        (SCHEMA_DIR / "timeline.schema.json").read_text(encoding="utf-8")
    )
    manifest_schema = json.loads(
        (SCHEMA_DIR / "manifest.schema.json").read_text(encoding="utf-8")
    )

    assert {"fps", "scenes"}.issubset(timeline_schema["required"])
    assert {"date", "status", "stage", "version"}.issubset(
        manifest_schema["required"]
    )
