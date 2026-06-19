import json
import subprocess
import sys
from pathlib import Path

import run_daily

ROOT = Path(__file__).parents[1]
CLI = ROOT / "skills" / "zhimian-video-studio" / "scripts" / "run_daily.py"


def test_benefit_override_is_preferred():
    assert run_daily._topic_benefit({"title": "x", "benefit": "我的卖点"}) == "我的卖点"
    # Falls back to the interview default when no benefit is supplied.
    assert "面试官" in run_daily._topic_benefit({"title": "x"})


def test_load_scenes_file_defaults_optional_fields(tmp_path: Path):
    path = tmp_path / "scenes.json"
    path.write_text(json.dumps({"scenes": [{"id": "a", "narration": "口播一"}]}, ensure_ascii=False), encoding="utf-8")
    scenes = run_daily._load_scenes_file(path)
    assert scenes[0]["on_screen_text"] == "口播一"
    assert scenes[0]["visual_type"] == "editorial"
    assert scenes[0]["source_refs"] == ["S1"]


def test_load_scenes_file_rejects_empty_narration(tmp_path: Path):
    path = tmp_path / "bad.json"
    path.write_text(json.dumps([{"id": "a", "narration": "   "}]), encoding="utf-8")
    try:
        run_daily._load_scenes_file(path)
    except ValueError as exc:
        assert "narration" in str(exc)
    else:
        raise AssertionError("empty narration must be rejected")


def test_scenes_file_drives_custom_narration_and_timeline(tmp_path: Path):
    scenes = {
        "scenes": [
            {"id": "intro", "narration": "第一句自定义口播", "visual_type": "comparison",
             "visual_payload": {"left": "a", "right": "b", "winner": "right"}, "source_refs": ["S1"]},
            {"id": "step", "narration": "第二句自定义口播", "visual_type": "flow",
             "visual_payload": {"steps": ["x", "y"]}, "source_refs": ["S1"]},
        ]
    }
    sf = tmp_path / "scenes.json"
    sf.write_text(json.dumps(scenes, ensure_ascii=False), encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(CLI), "--date", "2026-06-19", "--topic", "测试自定义",
         "--output-root", str(tmp_path / "out"), "--scenes-file", str(sf),
         "--dry-run", "--skip-audio", "--skip-render"],
        text=True, capture_output=True, encoding="utf-8",
    )
    assert result.returncode == 0, result.stderr
    out = tmp_path / "out" / "2026-06-19"
    narration = (out / "script" / "narration.md").read_text(encoding="utf-8")
    assert "第一句自定义口播" in narration and "第二句自定义口播" in narration
    timeline = json.loads((out / "script" / "timeline.json").read_text(encoding="utf-8"))
    assert [s["id"] for s in timeline["scenes"]] == ["intro", "step"]
