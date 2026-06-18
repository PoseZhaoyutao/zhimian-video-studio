import json
from pathlib import Path

from zhimian.workspace import prepare_run


def test_first_run_uses_date_root_and_creates_contract_directories(tmp_path: Path):
    run = prepare_run(tmp_path, "2026-06-18", rebuild=False)

    assert run.output_dir == tmp_path / "2026-06-18"
    assert run.version == 1
    for relative in [
        "research",
        "script",
        "audio/segments",
        "video",
        "cover",
        "copy",
        "qa/preview-frames",
        "logs",
    ]:
        assert (run.output_dir / relative).is_dir()


def test_successful_run_is_reused_without_rebuild(tmp_path: Path):
    run = prepare_run(tmp_path, "2026-06-18", rebuild=False)
    run.mark_success()

    reused = prepare_run(tmp_path, "2026-06-18", rebuild=False)

    assert reused.reused is True
    assert reused.output_dir == run.output_dir
    manifest = json.loads((run.output_dir / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["status"] == "success"


def test_rebuild_creates_next_version(tmp_path: Path):
    first = prepare_run(tmp_path, "2026-06-18", rebuild=False)
    first.mark_success()

    second = prepare_run(tmp_path, "2026-06-18", rebuild=True)
    second.mark_success()
    third = prepare_run(tmp_path, "2026-06-18", rebuild=True)

    assert second.output_dir == tmp_path / "2026-06-18" / "v2"
    assert second.version == 2
    assert third.output_dir == tmp_path / "2026-06-18" / "v3"
    assert third.version == 3


def test_invalid_date_is_rejected(tmp_path: Path):
    try:
        prepare_run(tmp_path, "18-06-2026", rebuild=False)
    except ValueError as exc:
        assert "YYYY-MM-DD" in str(exc)
    else:
        raise AssertionError("invalid date must be rejected")
