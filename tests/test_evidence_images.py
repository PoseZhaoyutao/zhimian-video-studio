import json
from pathlib import Path

import pytest

from zhimian.images import package_evidence_images


def _scenes() -> list[dict]:
    return [
        {"id": "hook", "narration": "开场"},
        {"id": "experiment", "narration": "实验"},
    ]


def test_package_evidence_images_copies_asset_and_injects_provenance(tmp_path: Path):
    source = tmp_path / "batchnorm-chart.png"
    source.write_bytes(b"png")
    evidence_map = tmp_path / "evidence-map.json"
    evidence_map.write_text(
        json.dumps(
            {
                "experiment": {
                    "path": str(source),
                    "alt": "BatchNorm 与 LayerNorm 的统计维度对比",
                    "source_url": "https://docs.pytorch.org/docs/stable/nn.html",
                    "source_title": "PyTorch normalization documentation",
                    "rights_basis": "official-documentation",
                    "license": "Documentation excerpt for commentary",
                    "attribution": "PyTorch documentation",
                    "role": "comparison",
                }
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    scenes = _scenes()
    report = package_evidence_images(scenes, evidence_map, tmp_path / "output")

    assert report["status"] == "ready"
    assert report["attached_count"] == 1
    scene = scenes[1]
    assert scene["image_file"] == "assets/evidence/experiment.png"
    assert scene["image_source_url"].startswith("https://")
    assert scene["image_rights_basis"] == "official-documentation"
    assert (tmp_path / "output" / "assets" / "evidence" / "experiment.png").read_bytes() == b"png"
    saved = json.loads((tmp_path / "output" / "assets" / "evidence-visuals.json").read_text(encoding="utf-8"))
    assert saved == report


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("source_url", "file:///tmp/source.png", "http"),
        ("source_title", "", "source_title"),
        ("rights_basis", "", "rights_basis"),
        ("alt", "", "alt"),
    ],
)
def test_package_evidence_images_rejects_missing_or_invalid_provenance(
    tmp_path: Path, field: str, value: str, message: str
):
    source = tmp_path / "figure.jpg"
    source.write_bytes(b"jpg")
    entry = {
        "path": str(source),
        "alt": "实验图",
        "source_url": "https://example.org/paper",
        "source_title": "Paper figure",
        "rights_basis": "paper-commentary",
        "license": "Short excerpt for commentary",
        "attribution": "Example authors",
        "role": "experiment",
    }
    entry[field] = value
    evidence_map = tmp_path / "evidence-map.json"
    evidence_map.write_text(json.dumps({"experiment": entry}), encoding="utf-8")

    with pytest.raises(ValueError, match=message):
        package_evidence_images(_scenes(), evidence_map, tmp_path / "output")


def test_package_evidence_images_rejects_unknown_scene(tmp_path: Path):
    source = tmp_path / "figure.webp"
    source.write_bytes(b"webp")
    evidence_map = tmp_path / "evidence-map.json"
    evidence_map.write_text(
        json.dumps(
            {
                "missing": {
                    "path": str(source),
                    "alt": "实验图",
                    "source_url": "https://example.org/paper",
                    "source_title": "Paper figure",
                    "rights_basis": "licensed",
                    "license": "CC BY 4.0",
                    "attribution": "Example authors",
                    "role": "experiment",
                }
            }
        ),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="unknown scene"):
        package_evidence_images(_scenes(), evidence_map, tmp_path / "output")
