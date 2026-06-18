import json
from pathlib import Path

from zhimian.remotion import build_still_command
from run_daily import _remotion_props


ROOT = Path(__file__).parents[1]
REMOTION = ROOT / "remotion"


def test_remotion_package_has_required_scripts_and_dependencies():
    package = json.loads((REMOTION / "package.json").read_text(encoding="utf-8"))
    assert {"typecheck", "compositions", "render", "cover"}.issubset(package["scripts"])
    for dependency in [
        "remotion",
        "@remotion/cli",
        "@remotion/media",
        "@remotion/captions",
        "@remotion/layout-utils",
        "react",
        "react-dom",
        "zod",
    ]:
        assert dependency in package["dependencies"] or dependency in package["devDependencies"]


def test_root_registers_vertical_video_and_cover_compositions():
    root = (REMOTION / "src" / "Root.tsx").read_text(encoding="utf-8")
    assert 'id="ZhiMianVideo"' in root
    assert 'id="ZhiMianCover"' in root
    assert "width={1080}" in root
    assert "height={1920}" in root
    assert "fps={30}" in root
    assert "calculateMetadata" in root


def test_editorial_tokens_match_approved_brand():
    design = (REMOTION / "src" / "design.ts").read_text(encoding="utf-8")
    for color in ["#F4EFE4", "#151515", "#E83F32", "#265CFF"]:
        assert color in design


def test_animations_are_frame_driven_not_css_driven():
    sources = "\n".join(
        path.read_text(encoding="utf-8")
        for path in (REMOTION / "src").rglob("*.tsx")
    )
    assert "useCurrentFrame" in sources
    assert "interpolate(" in sources or "spring(" in sources
    assert "@keyframes" not in sources
    assert "transition:" not in sources
    assert "animation:" not in sources


def test_motion_templates_are_available_for_non_text_scenes():
    sources = "\n".join(
        path.read_text(encoding="utf-8")
        for path in (REMOTION / "src").rglob("*.tsx")
    )
    for required in ["MotionBackdrop", "FlowDiagram", "ComparisonPanel", "FormulaReveal"]:
        assert required in sources

    types = (REMOTION / "src" / "types.ts").read_text(encoding="utf-8")
    for visual_type in ['"flow"', '"comparison"', '"formula"']:
        assert visual_type in types


def test_remotion_props_convert_python_timeline_to_component_contract():
    props = _remotion_props(
        {"day": 1, "column": "大厂拆招·算法", "title": "Attention为什么除以√d"},
        [
            {
                "id": "hook",
                "start_frame": 0,
                "duration_in_frames": 90,
                "start_seconds": 0,
                "end_seconds": 3,
                "narration": "面试官问 Attention",
                "on_screen_text": "Attention",
                "caption": "面试官问 Attention",
                "visual_type": "flow",
                "visual_payload": {},
                "audio_file": "generated/2026-06-18/01.wav",
            }
        ],
    )

    assert props["episode"] == "EP.01"
    assert props["scenes"][0]["startFrame"] == 0
    assert props["scenes"][0]["durationInFrames"] == 90
    assert props["scenes"][0]["onScreenText"] == "Attention"
    assert props["scenes"][0]["visualType"] == "flow"
    assert props["scenes"][0]["audioFile"] == "generated/2026-06-18/01.wav"
    assert props["captions"][0]["startMs"] == 0
    assert props["captions"][0]["endMs"] == 3000


def test_still_command_can_receive_props_file():
    command = build_still_command(
        remotion_bin=Path("remotion"),
        entry=Path("src/index.ts"),
        composition="ZhiMianCover",
        output=Path("cover.png"),
        props=Path("props.json"),
    )

    assert command == [
        "remotion",
        "still",
        "src\\index.ts" if "\\" in str(Path("src/index.ts")) else "src/index.ts",
        "ZhiMianCover",
        "cover.png",
        "--props",
        "props.json",
    ]
