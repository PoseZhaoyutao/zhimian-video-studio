import json
from pathlib import Path

import pytest

from zhimian.images import package_scene_images


def _scenes() -> list[dict]:
    return [
        {"id": "hook", "narration": "开场"},
        {"id": "principle", "narration": "原理"},
        {"id": "cta", "narration": "结尾"},
    ]


def test_package_scene_images_copies_assets_and_attaches_metadata(tmp_path: Path):
    hook = tmp_path / "source-hook.png"
    principle = tmp_path / "source-principle.webp"
    hook.write_bytes(b"png")
    principle.write_bytes(b"webp")
    image_map = tmp_path / "image-map.json"
    image_map.write_text(
        json.dumps(
            {
                "hook": {"path": str(hook), "alt": "AI 视频工作台", "prompt": "editorial AI studio"},
                "principle": {"path": str(principle), "alt": "抽象原理可视化", "prompt": "concept diagram"},
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    scenes = _scenes()
    report = package_scene_images(scenes, image_map, tmp_path / "output")

    assert report["status"] == "ready"
    assert report["requested_count"] == 2
    assert report["attached_count"] == 2
    assert scenes[0]["image_file"] == "assets/generated/hook.png"
    assert scenes[0]["image_alt"] == "AI 视频工作台"
    assert scenes[0]["image_prompt"] == "editorial AI studio"
    assert (tmp_path / "output" / "assets" / "generated" / "hook.png").read_bytes() == b"png"
    saved = json.loads((tmp_path / "output" / "assets" / "image-plan.json").read_text(encoding="utf-8"))
    assert saved == report


def test_package_scene_images_records_motion_only_fallback(tmp_path: Path):
    scenes = _scenes()

    report = package_scene_images(scenes, None, tmp_path / "output")

    assert report["status"] == "not_provided"
    assert report["attached_count"] == 0
    assert all("image_file" not in scene for scene in scenes)
    assert (tmp_path / "output" / "assets" / "image-plan.json").exists()


def test_package_scene_images_rejects_unknown_scene_and_unsafe_extension(tmp_path: Path):
    source = tmp_path / "asset.svg"
    source.write_text("<svg/>", encoding="utf-8")
    image_map = tmp_path / "image-map.json"
    image_map.write_text(
        json.dumps({"unknown": {"path": str(source), "alt": "x", "prompt": "y"}}),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="unknown scene"):
        package_scene_images(_scenes(), image_map, tmp_path / "output")

    image_map.write_text(
        json.dumps({"hook": {"path": str(source), "alt": "x", "prompt": "y"}}),
        encoding="utf-8",
    )
    with pytest.raises(ValueError, match="PNG, JPEG, or WebP"):
        package_scene_images(_scenes(), image_map, tmp_path / "output-2")
