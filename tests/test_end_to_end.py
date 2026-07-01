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
        "assets/image-plan.json",
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
    assert manifest["topic"]["title"] == "LoRA为什么低秩更新也能微调大模型"
    assert manifest["topic"]["column"] == "大厂拆招·AI算法"

    timeline = json.loads((day / "script" / "timeline.json").read_text(encoding="utf-8"))
    assert timeline["fps"] == 30
    assert len(timeline["scenes"]) >= 6
    assert all(scene["duration_in_frames"] > 0 for scene in timeline["scenes"])
    assert {"comparison", "flow", "formula"}.issubset({scene["visual_type"] for scene in timeline["scenes"]})

    report = json.loads((day / "qa" / "report.json").read_text(encoding="utf-8"))
    assert report["passed"] is True


def test_cli_dry_run_packages_model_generated_scene_images(tmp_path: Path):
    source_dir = tmp_path / "model-images"
    source_dir.mkdir()
    hook = source_dir / "hook.png"
    principle = source_dir / "principle.jpg"
    hook.write_bytes(b"generated hook")
    principle.write_bytes(b"generated principle")
    image_map = tmp_path / "image-map.json"
    image_map.write_text(
        json.dumps(
            {
                "hook": {"path": str(hook), "alt": "推荐合集开场", "prompt": "editorial creator studio"},
                "principle": {"path": str(principle), "alt": "原理图", "prompt": "abstract principle"},
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            str(CLI),
            "--date",
            "2026-07-04",
            "--output-root",
            str(tmp_path / "outputs"),
            "--image-map",
            str(image_map),
            "--dry-run",
            "--skip-audio",
            "--skip-render",
        ],
        text=True,
        capture_output=True,
        encoding="utf-8",
    )

    assert result.returncode == 0, result.stderr
    output_dir = tmp_path / "outputs" / "2026-07-04"
    timeline = json.loads((output_dir / "script" / "timeline.json").read_text(encoding="utf-8"))
    by_id = {scene["id"]: scene for scene in timeline["scenes"]}
    assert by_id["hook"]["image_file"] == "assets/generated/hook.png"
    assert by_id["principle"]["image_file"] == "assets/generated/principle.jpg"
    image_plan = json.loads((output_dir / "assets" / "image-plan.json").read_text(encoding="utf-8"))
    assert image_plan["attached_count"] == 2


def test_cli_dry_run_packages_web_evidence_images_with_provenance(tmp_path: Path):
    source = tmp_path / "tutorial-comparison.png"
    source.write_bytes(b"web evidence")
    evidence_map = tmp_path / "evidence-map.json"
    evidence_map.write_text(
        json.dumps(
            {
                "principle": {
                    "path": str(source),
                    "alt": "官方教程中的归一化对比",
                    "source_url": "https://docs.pytorch.org/docs/stable/nn.html",
                    "source_title": "PyTorch normalization documentation",
                    "rights_basis": "official-documentation",
                    "license": "Documentation excerpt for commentary",
                    "attribution": "PyTorch documentation",
                    "role": "tutorial",
                }
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            str(CLI),
            "--date",
            "2026-06-11",
            "--output-root",
            str(tmp_path / "outputs"),
            "--evidence-map",
            str(evidence_map),
            "--dry-run",
            "--skip-audio",
            "--skip-render",
        ],
        text=True,
        capture_output=True,
        encoding="utf-8",
    )

    assert result.returncode == 0, result.stderr
    output_dir = tmp_path / "outputs" / "2026-06-11"
    timeline = json.loads((output_dir / "script" / "timeline.json").read_text(encoding="utf-8"))
    by_id = {scene["id"]: scene for scene in timeline["scenes"]}
    assert by_id["principle"]["image_file"] == "assets/evidence/principle.png"
    assert by_id["principle"]["image_source_url"].startswith("https://")
    evidence = json.loads((output_dir / "assets" / "evidence-visuals.json").read_text(encoding="utf-8"))
    assert evidence["attached_count"] == 1


def test_cli_dry_run_accepts_custom_topic(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(CLI),
            "--date",
            "2026-07-03",
            "--output-root",
            str(tmp_path),
            "--topic",
            "如何用AI审查后端系统设计方案",
            "--column",
            "AI实操",
            "--dry-run",
            "--skip-audio",
            "--skip-render",
        ],
        text=True,
        capture_output=True,
        encoding="utf-8",
    )

    assert result.returncode == 0, result.stderr
    manifest = json.loads((tmp_path / "2026-07-03" / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["topic"]["title"] == "如何用AI审查后端系统设计方案"
    assert manifest["topic"]["column"] == "AI实操"


def test_cli_dry_run_adapts_ai_skill_recommendation_topic(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(CLI),
            "--date",
            "2026-06-18",
            "--output-root",
            str(tmp_path),
            "--topic",
            "AI优质技能推荐合集：智面引擎",
            "--column",
            "AI技能推荐",
            "--dry-run",
            "--skip-audio",
            "--skip-render",
        ],
        text=True,
        capture_output=True,
        encoding="utf-8",
    )

    assert result.returncode == 0, result.stderr
    output_dir = tmp_path / "2026-06-18"
    narration = (output_dir / "script" / "narration.md").read_text(encoding="utf-8")
    douyin_copy = (output_dir / "copy" / "douyin.md").read_text(encoding="utf-8")
    sources = (output_dir / "research" / "sources.md").read_text(encoding="utf-8")

    assert "AI 优质技能推荐合集" in narration
    assert "Remotion" in narration
    assert "VoxCPM2" in narration
    assert "面试官" not in douyin_copy
    assert "https://www.remotion.dev/docs/" in sources
    assert "https://github.com/OpenBMB/VoxCPM" in sources


def test_cli_rebuild_creates_versioned_folder(tmp_path: Path):
    base = [sys.executable, str(CLI), "--date", "2026-06-18", "--output-root", str(tmp_path), "--dry-run", "--skip-audio", "--skip-render"]
    first = subprocess.run(base, text=True, capture_output=True, encoding="utf-8")
    second = subprocess.run(base + ["--rebuild"], text=True, capture_output=True, encoding="utf-8")

    assert first.returncode == 0
    assert second.returncode == 0
    assert (tmp_path / "2026-06-18" / "v2" / "manifest.json").exists()
