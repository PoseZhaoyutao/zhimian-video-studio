import json
from pathlib import Path

from zhimian.qa import run_qa
from zhimian.remotion import build_render_command, build_still_command


def _write_minimal_package(root: Path) -> None:
    for directory in ["script", "copy", "research", "video", "cover", "qa"]:
        (root / directory).mkdir(parents=True, exist_ok=True)
    (root / "script" / "timeline.json").write_text(
        json.dumps(
            {
                "fps": 30,
                "scenes": [
                    {
                        "id": "hook",
                        "narration": "问题",
                        "source_refs": ["S1"],
                    }
                ],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (root / "research" / "sources.md").write_text("[S1] 官方文档", encoding="utf-8")
    for name in ["xiaohongshu.md", "douyin.md", "bilibili.md"]:
        (root / "copy" / name).write_text("标题\n标签\n描述", encoding="utf-8")
    (root / "video" / "final-9x16.mp4").write_bytes(b"video")
    (root / "cover" / "cover-9x16.png").write_bytes(b"cover")


def test_remotion_commands_are_argument_arrays_not_shell_strings(tmp_path: Path):
    render = build_render_command(
        remotion_bin=Path("remotion.cmd"),
        entry=Path("src/index.ts"),
        composition="ZhiMianVideo",
        output=tmp_path / "final.mp4",
        props=tmp_path / "props.json",
    )
    still = build_still_command(
        remotion_bin=Path("remotion.cmd"),
        entry=Path("src/index.ts"),
        composition="ZhiMianCover",
        output=tmp_path / "cover.png",
    )

    assert isinstance(render, list)
    assert "&" not in " ".join(render)
    assert "--props" in render
    assert still[-1] == str(tmp_path / "cover.png")


def test_qa_passes_complete_dry_run_package(tmp_path: Path):
    _write_minimal_package(tmp_path)
    report = run_qa(
        tmp_path,
        media_probe=lambda _: {"width": 1080, "height": 1920, "fps": 30, "duration": 75, "has_audio": True},
    )

    assert report["passed"] is True
    assert report["failures"] == []
    assert (tmp_path / "qa" / "report.json").exists()


def test_qa_fails_when_platform_copy_is_missing(tmp_path: Path):
    _write_minimal_package(tmp_path)
    (tmp_path / "copy" / "douyin.md").unlink()

    report = run_qa(tmp_path, media_probe=lambda _: {})

    assert report["passed"] is False
    assert any("douyin.md" in failure for failure in report["failures"])


def test_qa_fails_when_source_refs_are_missing(tmp_path: Path):
    _write_minimal_package(tmp_path)
    timeline = json.loads((tmp_path / "script" / "timeline.json").read_text(encoding="utf-8"))
    timeline["scenes"][0]["source_refs"] = []
    (tmp_path / "script" / "timeline.json").write_text(json.dumps(timeline), encoding="utf-8")

    report = run_qa(tmp_path, media_probe=lambda _: {})

    assert report["passed"] is False
    assert any("source_refs" in failure for failure in report["failures"])


def test_qa_fails_wrong_video_metadata(tmp_path: Path):
    _write_minimal_package(tmp_path)
    report = run_qa(
        tmp_path,
        media_probe=lambda _: {"width": 1920, "height": 1080, "fps": 30, "duration": 75, "has_audio": True},
    )

    assert report["passed"] is False
    assert any("1080x1920" in failure for failure in report["failures"])
