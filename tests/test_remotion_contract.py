import json
from pathlib import Path

from zhimian.remotion import build_still_command
from run_daily import _remotion_props, _render_remotion, _silent_wav


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
    for required in ["MotionBackdrop", "FlowDiagram", "ComparisonPanel", "FormulaReveal", "SceneWipe", "KineticHeadline", "SceneImage"]:
        assert required in sources

    types = (REMOTION / "src" / "types.ts").read_text(encoding="utf-8")
    for visual_type in ['"flow"', '"comparison"', '"formula"']:
        assert visual_type in types


def test_hyperframes_inspired_motion_grammar_is_frame_driven():
    transition = (REMOTION / "src" / "components" / "SceneWipe.tsx").read_text(encoding="utf-8")
    headline = (REMOTION / "src" / "components" / "KineticHeadline.tsx").read_text(encoding="utf-8")
    captions = (REMOTION / "src" / "components" / "Captions.tsx").read_text(encoding="utf-8")

    assert "interpolate(" in transition
    assert "clipPath" in headline
    assert "scaleX" in headline
    assert "spring(" in captions


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
                "image_file": "assets/generated/hook.png",
                "image_alt": "Attention 可视化",
                "image_prompt": "editorial attention mechanism",
            }
        ],
    )

    assert props["episode"] == "EP.01"
    assert props["scenes"][0]["startFrame"] == 0
    assert props["scenes"][0]["durationInFrames"] == 90
    assert props["scenes"][0]["onScreenText"] == "Attention"
    assert props["scenes"][0]["visualType"] == "flow"
    assert props["scenes"][0]["audioFile"] == "generated/2026-06-18/01.wav"
    assert props["scenes"][0]["imageFile"] == "assets/generated/hook.png"
    assert props["scenes"][0]["imageAlt"] == "Attention 可视化"
    assert props["scenes"][0]["imagePrompt"] == "editorial attention mechanism"
    assert props["captions"][0]["startMs"] == 0
    assert props["captions"][0]["endMs"] == 3000


def test_remotion_props_shortens_skill_recommendation_display_title():
    props = _remotion_props(
        {"day": 18, "column": "AI技能推荐", "title": "AI优质技能推荐合集：智面引擎让每个行业都能做科普视频"},
        [
            {
                "id": "hook",
                "start_frame": 0,
                "duration_in_frames": 30,
                "start_seconds": 0,
                "end_seconds": 1,
                "narration": "测试",
                "on_screen_text": "测试",
                "caption": "测试",
                "visual_type": "comparison",
                "visual_payload": {},
                "audio_file": "generated/2026-06-18/01.wav",
            }
        ],
    )

    assert props["title"] == "AI技能推荐：智面引擎"
    assert props["benefit"] == "把好用 AI 技能变成行业科普生产线"


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


def test_render_remotion_resolves_output_paths_before_changing_cwd(tmp_path, monkeypatch):
    remotion_root = tmp_path / "remotion"
    bin_dir = remotion_root / "node_modules" / ".bin"
    bin_dir.mkdir(parents=True)
    for executable in ["remotion", "remotion.cmd"]:
        (bin_dir / executable).write_text("", encoding="utf-8")
    (remotion_root / "src").mkdir(parents=True)
    (remotion_root / "src" / "index.ts").write_text("export {};\n", encoding="utf-8")

    output_dir = tmp_path / "outputs" / "2026-06-18"
    _silent_wav(output_dir / "audio" / "segments" / "01.wav", 1.0)

    commands = []

    def fake_run(command, cwd, check):
        commands.append((command, cwd, check))

    monkeypatch.setattr("run_daily._repo_root", lambda: tmp_path)
    monkeypatch.setattr("run_daily.subprocess.run", fake_run)
    monkeypatch.chdir(tmp_path)

    _render_remotion(
        Path("outputs") / "2026-06-18",
        "2026-06-18",
        {"day": 18, "column": "AI技能推荐", "title": "AI优质技能推荐合集"},
        [
            {
                "id": "hook",
                "start_frame": 0,
                "duration_in_frames": 30,
                "start_seconds": 0,
                "end_seconds": 1,
                "narration": "测试",
                "on_screen_text": "测试",
                "caption": "测试",
                "visual_type": "flow",
                "visual_payload": {},
                "audio_file": "generated/2026-06-18/01.wav",
            }
        ],
    )

    assert len(commands) == 2
    render_command = commands[0][0]
    still_command = commands[1][0]
    assert commands[0][1] == remotion_root
    assert Path(render_command[4]).is_absolute()
    assert Path(render_command[render_command.index("--props") + 1]).is_absolute()
    assert Path(still_command[4]).is_absolute()
    assert Path(still_command[still_command.index("--props") + 1]).is_absolute()


def test_scene_image_animation_is_frame_driven_and_uses_static_assets():
    source = (REMOTION / "src" / "components" / "SceneImage.tsx").read_text(encoding="utf-8")

    assert "useCurrentFrame" in source
    assert "interpolate(" in source
    assert "staticFile(" in source
    assert "Img" in source
    assert "imageAlt" in source
    assert 'objectPosition: "center 35%"' in source
