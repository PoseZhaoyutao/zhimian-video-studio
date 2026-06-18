import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).parents[1]
CLI = ROOT / "skills" / "zhimian-video-studio" / "scripts" / "run_daily.py"


def test_cli_dry_run_creates_complete_dated_package(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(CLI),
            "--date",
            "2026-06-18",
            "--output-root",
            str(tmp_path),
            "--dry-run",
            "--skip-audio",
            "--skip-render",
        ],
        text=True,
        capture_output=True,
        encoding="utf-8",
    )

    assert result.returncode == 0, result.stderr
    day = tmp_path / "2026-06-18"
    expected_files = [
        "manifest.json",
        "research/sources.md",
        "script/narration.md",
        "script/timeline.md",
        "script/timeline.json",
        "audio/segments/01.wav",
        "audio/narration.wav",
        "video/final-9x16.mp4",
        "cover/cover-9x16.png",
        "copy/xiaohongshu.md",
        "copy/douyin.md",
        "copy/bilibili.md",
        "qa/report.json",
        "logs/production.log",
    ]
    for relative in expected_files:
        assert (day / relative).exists(), relative

    manifest = json.loads((day / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["status"] == "dry_run"
    assert manifest["stage"] == "verified"
    assert manifest["topic"]["title"] == "用AI练习算法题，而不是直接抄答案"

    timeline = json.loads((day / "script" / "timeline.json").read_text(encoding="utf-8"))
    assert timeline["fps"] == 30
    assert len(timeline["scenes"]) >= 6
    assert all(scene["duration_in_frames"] > 0 for scene in timeline["scenes"])

    report = json.loads((day / "qa" / "report.json").read_text(encoding="utf-8"))
    assert report["passed"] is True


def test_cli_rebuild_creates_versioned_folder(tmp_path: Path):
    base = [sys.executable, str(CLI), "--date", "2026-06-18", "--output-root", str(tmp_path), "--dry-run", "--skip-audio", "--skip-render"]
    first = subprocess.run(base, text=True, capture_output=True, encoding="utf-8")
    second = subprocess.run(base + ["--rebuild"], text=True, capture_output=True, encoding="utf-8")

    assert first.returncode == 0
    assert second.returncode == 0
    assert (tmp_path / "2026-06-18" / "v2" / "manifest.json").exists()
