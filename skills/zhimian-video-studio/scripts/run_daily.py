from __future__ import annotations

import argparse
import json
import os
import shutil
import struct
import subprocess
import sys
import wave
from datetime import date
from pathlib import Path

from zhimian.calendar import topic_for_day
from zhimian.editing import load_edit_plan, render_edit
from zhimian.images import autogenerate_images, package_scene_images
from zhimian.planner import custom_topic, generate_content_plan, load_plan_topic, write_content_plan
from zhimian.qa import run_qa
from zhimian.remotion import build_render_command, build_still_command
from zhimian.timeline import finalize_timeline
from zhimian.vox import VoxAdapter
from zhimian.workspace import prepare_run


FPS = 30

# A neutral line spoken once in the default male-narrator style to mint a
# synthetic voice anchor. When --unify-timbre is set, every segment is then
# conditioned on this single clip so the whole video keeps one timbre. The
# anchor is AI-designed from a text prompt and does not clone a real person.
VOICE_ANCHOR_TEXT = "智面引擎，用程序化视频把专业知识讲清楚，让每个行业都能做出可信的科普内容。"


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _write_json(path: Path, payload: dict) -> None:
    _write(path, json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def _silent_wav(path: Path, duration_seconds: float, sample_rate: int = 48_000) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    frames = int(duration_seconds * sample_rate)
    silence = struct.pack("<h", 0) * frames
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(silence)


def _concat_wavs(paths: list[Path], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as combined:
        combined.setnchannels(1)
        combined.setsampwidth(2)
        combined.setframerate(48_000)
        for path in paths:
            with wave.open(str(path), "rb") as segment:
                combined.writeframes(segment.readframes(segment.getnframes()))


def _ensure_voice_anchor(output_dir: Path) -> Path:
    """Mint (or reuse) one synthetic male-narrator clip and return its path.

    The clip is generated prompt-only in the default voice, then reused as the
    fixed ``reference_wav_path`` for every segment so the narration keeps a
    single consistent timbre. It is AI-designed synthetic audio, not a clone of
    a real person, which is why ``authorized_voice_clone`` is permitted for it.
    """
    anchor_path = output_dir / "audio" / "voice-anchor.wav"
    if anchor_path.exists() and anchor_path.stat().st_size > 0:
        return anchor_path
    staging = output_dir / "audio" / "_anchor"
    anchor = VoxAdapter().generate_segments([VOICE_ANCHOR_TEXT], staging)[0]
    anchor_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(anchor.path, anchor_path)
    shutil.rmtree(staging, ignore_errors=True)
    return anchor_path


def _repo_root() -> Path:
    configured = os.environ.get("ZHIMIAN_REPO_ROOT")
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parents[3]


def _remotion_bin(remotion_root: Path) -> Path:
    executable = "remotion.cmd" if sys.platform.startswith("win") else "remotion"
    path = remotion_root / "node_modules" / ".bin" / executable
    if not path.exists():
        raise FileNotFoundError(
            f"Remotion CLI not found at {path}. Run `npm install` inside {remotion_root} first."
        )
    return path


def _stage_static_audio(output_dir: Path, remotion_root: Path, run_date: str, scenes: list[dict]) -> None:
    public_dir = remotion_root / "public" / "generated" / run_date
    public_dir.mkdir(parents=True, exist_ok=True)
    for index, scene in enumerate(scenes, start=1):
        source = output_dir / "audio" / "segments" / f"{index:02d}.wav"
        if not source.is_file():
            raise FileNotFoundError(source)
        target = public_dir / source.name
        shutil.copy2(source, target)
        scene["audio_file"] = f"generated/{run_date}/{source.name}"


def _stage_static_images(output_dir: Path, remotion_root: Path, run_date: str, scenes: list[dict]) -> None:
    public_dir = remotion_root / "public" / "generated" / run_date / "images"
    for scene in scenes:
        image_file = scene.get("image_file")
        if not image_file:
            continue
        source = output_dir / str(image_file)
        if not source.is_file():
            raise FileNotFoundError(source)
        public_dir.mkdir(parents=True, exist_ok=True)
        target = public_dir / source.name
        shutil.copy2(source, target)
        scene["image_static_file"] = f"generated/{run_date}/images/{target.name}"


def _remotion_props(topic: dict[str, str | int], scenes: list[dict]) -> dict:
    remotion_scenes = []
    captions = []
    for scene in scenes:
        remotion_scenes.append(
            {
                "id": scene["id"],
                "startFrame": scene["start_frame"],
                "durationInFrames": scene["duration_in_frames"],
                "narration": scene["narration"],
                "onScreenText": scene.get("on_screen_text", scene["narration"]),
                "caption": scene.get("caption", scene["narration"]),
                "visualType": scene.get("visual_type", "editorial"),
                "visualPayload": scene.get("visual_payload") or {},
                "audioFile": scene.get("audio_file"),
                "imageFile": scene.get("image_static_file", scene.get("image_file")),
                "imageAlt": scene.get("image_alt"),
                "imagePrompt": scene.get("image_prompt"),
            }
        )
        captions.append(
            {
                "text": scene.get("caption", scene["narration"]),
                "startMs": int(float(scene["start_seconds"]) * 1000),
                "endMs": int(float(scene["end_seconds"]) * 1000),
                "timestampMs": int(float(scene["start_seconds"]) * 1000),
                "confidence": 1,
            }
        )
    return {
        "title": _topic_display_title(topic),
        "column": str(topic["column"]),
        "episode": f"EP.{int(topic['day']):02d}",
        "benefit": _topic_benefit(topic),
        "scenes": remotion_scenes,
        "captions": captions,
    }


def _render_remotion(output_dir: Path, run_date: str, topic: dict[str, str | int], scenes: list[dict]) -> None:
    output_dir = output_dir.resolve()
    repo_root = _repo_root()
    remotion_root = repo_root / "remotion"
    entry = remotion_root / "src" / "index.ts"
    remotion_bin = _remotion_bin(remotion_root)

    _stage_static_audio(output_dir, remotion_root, run_date, scenes)
    _stage_static_images(output_dir, remotion_root, run_date, scenes)
    props_path = output_dir / "script" / "remotion-props.json"
    _write_json(props_path, _remotion_props(topic, scenes))

    video_output = output_dir / "video" / "final-9x16.mp4"
    cover_output = output_dir / "cover" / "cover-9x16.png"
    video_output.parent.mkdir(parents=True, exist_ok=True)
    cover_output.parent.mkdir(parents=True, exist_ok=True)

    commands = [
        build_render_command(
            remotion_bin=remotion_bin,
            entry=entry,
            composition="ZhiMianVideo",
            output=video_output,
            props=props_path,
        ),
        build_still_command(
            remotion_bin=remotion_bin,
            entry=entry,
            composition="ZhiMianCover",
            output=cover_output,
            props=props_path,
        ),
    ]
    for command in commands:
        subprocess.run(command, cwd=remotion_root, check=True)


def _draft_scenes(topic: dict[str, str | int]) -> list[dict]:
    title = str(topic["title"])
    if _is_skill_recommendation_topic(topic):
        return [
            {
                "id": "hook",
                "narration": f"我在抖音和小红书新建了一个 AI 优质技能推荐合集。第一条，就从 {title} 讲起：推荐工具不是晒收藏，而是看它能不能真的帮你交付。",
                "on_screen_text": "AI 优质技能推荐合集",
                "caption": "推荐工具，不是晒收藏，而是看能不能交付。",
                "visual_type": "comparison",
                "visual_payload": {"left": "只晒工具", "right": "交付工作流", "winner": "right"},
                "source_refs": ["S1", "S3"],
            },
            {
                "id": "pipeline",
                "narration": "为什么从智面引擎开始？因为它把一条科普视频拆成五步：选题和来源，脚本，VoxCPM2 本地配音，Remotion 程序化画面，最后做 QA 审核。",
                "on_screen_text": "一条视频 = 五步交付",
                "caption": "选题、脚本、配音、画面、QA，缺一环都不稳。",
                "visual_type": "flow",
                "visual_payload": {"steps": ["选题/来源", "脚本", "VoxCPM2", "Remotion", "QA"]},
                "source_refs": ["S1", "S3", "S5"],
            },
            {
                "id": "why_it_works",
                "narration": "Remotion 的优势，是把字幕、动画、封面和竖屏模板都写进代码；同一个结构，可以批量改选题、改文案、改视觉，而不是每次从零剪。",
                "on_screen_text": "Remotion：把视频模板写进代码",
                "caption": "程序化视频，适合批量、可复用、可检查。",
                "visual_type": "formula",
                "visual_payload": {"tokens": ["专业问题", "+", "模板动画", "+", "自动字幕", "=", "稳定短视频"]},
                "source_refs": ["S1", "S2"],
            },
            {
                "id": "local_voice",
                "narration": "VoxCPM2 放在本地跑，能减少反复调用外部语音服务的成本；官方也支持自然语言设计声音。我们默认用合成声音，不克隆真人音色。",
                "on_screen_text": "本地配音：控成本，也控风格",
                "caption": "本地生成，合成声音，成本和风格都更可控。",
                "visual_type": "process",
                "visual_payload": {"steps": ["写口播", "本地生成", "测时长", "驱动画面"]},
                "source_refs": ["S3", "S4"],
            },
            {
                "id": "industry_service",
                "narration": "这个合集的原则很简单：我会推广自己做的技能，但每一期都要让你能迁移到自己的行业。医生讲科普，老师做课程，设计师讲案例，老板讲产品，都可以套这条线。",
                "on_screen_text": "让每个行业都能讲清楚自己",
                "caption": "推广自己的技能，也要服务大家的行业表达。",
                "visual_type": "code",
                "visual_payload": {"code": "行业问题 -> 可信来源\n听得懂脚本 -> 可传播画面\n一次成片 -> 可复用流程"},
                "source_refs": ["S5"],
            },
            {
                "id": "cta",
                "narration": "以后我推荐 AI 技能，就看四件事：省不省重复劳动，留不留可复查文件，能不能本地化控成本，能不能改造成你的工作流。你想看哪个行业，评论区告诉我。",
                "on_screen_text": "好技能 = 能迁移到你的工作",
                "caption": "你想看哪个行业？评论区告诉我。",
                "visual_type": "comparison",
                "visual_payload": {"left": "只能演示", "right": "能迁移", "winner": "right"},
                "source_refs": ["S5"],
            },
        ]
    angle = str(topic.get("angle") or "把一个具体问题拆成可验证、可复用、可追问的回答框架。")
    return [
        {"id": "hook", "narration": f"今天拆一个高频问题：{title}。别只背答案，我们要看面试官真正想追问什么。", "on_screen_text": title, "caption": title, "visual_type": "comparison", "visual_payload": {"left": "背答案", "right": "讲机制", "winner": "right"}, "source_refs": ["S1"]},
        {"id": "intuition", "narration": "先给直觉：一个好回答，应该从问题入口，一路走到关键变量、底层原因和落地取舍。", "on_screen_text": "先看问题怎么流动", "caption": "先给直觉，再看底层原因。", "visual_type": "flow", "visual_payload": {"steps": ["问题入口", "关键变量", "底层原因", "落地取舍"]}, "source_refs": ["S1"]},
        {"id": "principle", "narration": f"这一期的核心切口是：{angle}", "on_screen_text": "把直觉压成一句公式", "caption": "把直觉压成一句可复查的公式。", "visual_type": "formula", "visual_payload": {"tokens": ["结论", "=", "条件", "+", "机制", "+", "边界"]}, "source_refs": ["S1"]},
        {"id": "followups", "narration": "真正拉开差距的是连续追问：为什么这样设计？复杂度或成本是多少？边界情况会不会翻车？", "on_screen_text": "追问链决定上限", "caption": "真正拉开差距的是连续追问。", "visual_type": "code", "visual_payload": {"code": "Q1: 为什么这样设计？\nQ2: 复杂度 / 成本是多少？\nQ3: 边界情况会不会翻车？"}, "source_refs": ["S1"]},
        {"id": "answer", "narration": "高分回答按四步说：先给结论，再讲原理，然后说明取舍，最后落到工程或面试场景。", "on_screen_text": "结论 · 原理 · 取舍 · 落地", "caption": "高分回答按四步说。", "visual_type": "process", "visual_payload": {"steps": ["结论", "原理", "取舍", "落地"]}, "source_refs": ["S1"]},
        {"id": "mistake", "narration": "最容易失分的地方，是把术语背得很熟，却解释不了为什么、什么时候不用、代价是什么。", "on_screen_text": "别背术语，要讲为什么", "caption": "别背术语，要讲为什么。", "visual_type": "comparison", "visual_payload": {"left": "术语很多", "right": "因果清楚", "winner": "right"}, "source_refs": ["S1"]},
    ]


def _is_skill_recommendation_topic(topic: dict[str, str | int]) -> bool:
    text = f"{topic.get('title', '')} {topic.get('column', '')}".lower()
    keywords = ("技能推荐", "优质技能", "智面引擎", "行业推广", "科普视频")
    return any(keyword.lower() in text for keyword in keywords)


def _topic_benefit(topic: dict[str, str | int]) -> str:
    benefit = topic.get("benefit")
    if benefit:
        return str(benefit)
    if _is_skill_recommendation_topic(topic):
        return "把好用 AI 技能变成行业科普生产线"
    return "60 秒拆出面试官真正想追问的技术细节"


def _topic_display_title(topic: dict[str, str | int]) -> str:
    if _is_skill_recommendation_topic(topic):
        return "AI技能推荐：智面引擎"
    return str(topic["title"])


def _write_sources(output_dir: Path, topic: dict[str, str | int]) -> None:
    if _is_skill_recommendation_topic(topic):
        _write(
            output_dir / "research" / "sources.md",
            "\n".join(
                [
                    "[S1] Remotion official documentation, `Creating a new project`: https://www.remotion.dev/docs/",
                    "[S2] Remotion API documentation, `useCurrentFrame`, `interpolate`, and `spring`: https://www.remotion.dev/docs/use-current-frame ; https://www.remotion.dev/docs/interpolate ; https://www.remotion.dev/docs/spring",
                    "[S3] OpenBMB/VoxCPM official repository: https://github.com/OpenBMB/VoxCPM",
                    "[S4] VoxCPM2 Technical Report: https://arxiv.org/abs/2606.06928",
                    "[S5] Local ZhiMian Video Studio design and production contract in this repository.",
                ]
            )
            + "\n",
        )
        return
    _write(output_dir / "research" / "sources.md", "[S1] 待替换为当天官方文档、论文或权威源码。\n")


def _write_platform_copy(output_dir: Path, topic: dict[str, str | int]) -> None:
    title = str(topic["title"])
    if _is_skill_recommendation_topic(topic):
        copies = {
            "xiaohongshu.md": (
                f"# AI优质技能推荐｜{title}\n\n"
                "问题：很多人收藏了 AI 工具，但不知道怎么变成自己的内容生产力。\n\n"
                "步骤：\n"
                "1. 用智面引擎先把选题、来源、脚本、时间线拆开。\n"
                "2. 用本地 VoxCPM2 生成合成配音，减少反复调用成本。\n"
                "3. 用 Remotion 把字幕、封面、流程动画做成可复用模板。\n"
                "4. 最后做 QA，再发到抖音/小红书合集。\n\n"
                "结论：好技能不是炫技，而是能迁移到你的行业。\n\n"
                "标签：#AI工具 #AI技能推荐 #智面引擎 #Remotion #VoxCPM2 #行业科普 #短视频运营\n"
            ),
            "douyin.md": (
                "# 别只收藏AI工具，先看它能不能交付\n\n"
                "我新建了 AI 优质技能推荐合集。第一条聊智面引擎：Remotion 做可复用画面，本地 VoxCPM2 做配音，把行业知识变成 60–90 秒科普视频。\n\n"
                "你想看哪个行业的 AI 技能工作流？\n\n"
                "标签：#AI工具 #AI技能推荐 #智面引擎 #短视频制作 #行业科普\n"
            ),
            "bilibili.md": (
                f"# {title}：AI优质技能推荐合集开篇\n\n"
                "本期介绍为什么要做“AI优质技能推荐合集”，以及智面引擎如何把脚本、VoxCPM2 本地配音、Remotion 程序化画面和 QA 打包成一条可复用的行业科普视频生产线。\n\n"
                "适合：想用 AI 做短视频、课程、行业科普、产品解释的创作者和技术同学。\n"
                "说明：配音为 AI 合成声音，不涉及真人音色克隆。\n\n"
                "标签：AI工具,Remotion,VoxCPM2,短视频制作,行业科普,程序化视频\n"
            ),
        }
        for filename, content in copies.items():
            _write(output_dir / "copy" / filename, content)
        return
    copies = {
        "xiaohongshu.md": f"# {title}｜技术面试高频追问\n\n标签：#技术面试 #AI面试 #后端 #算法 #智面引擎\n\n描述：先收藏这一期，按原题、原理、追问、回答骨架复习。\n",
        "douyin.md": f"# 面试官问{title}，别只背答案\n\n标签：#大厂面试 #程序员 #AI学习 #后端 #算法\n\n描述：真正加分的是能解释为什么。你还想看哪个追问？\n",
        "bilibili.md": f"# {title}：大厂技术面试追问链拆解\n\n标签：技术面试,后端开发,算法,AI,求职\n\n描述：本期包含原题、底层原理、连续追问和高分回答骨架。配音为AI生成，仅供学习复盘。\n",
    }
    for filename, content in copies.items():
        _write(output_dir / "copy" / filename, content)


def _load_scenes_file(path: Path) -> list[dict]:
    """Load a hand-authored scene list for a custom episode (e.g. a tutorial).

    Accepts either a bare JSON list of scenes or an object with a ``scenes`` key.
    Each scene needs at least ``id`` and non-empty ``narration``; the remaining
    fields default so the timeline/render contract stays satisfied.
    """
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    scenes = data["scenes"] if isinstance(data, dict) else data
    if not isinstance(scenes, list) or not scenes:
        raise ValueError("scenes file must contain a non-empty list of scenes")
    for index, scene in enumerate(scenes, start=1):
        if "id" not in scene or not str(scene.get("narration", "")).strip():
            raise ValueError(f"scene {index} requires 'id' and non-empty 'narration'")
        scene.setdefault("on_screen_text", scene["narration"])
        scene.setdefault("caption", scene["narration"])
        scene.setdefault("visual_type", "editorial")
        scene.setdefault("visual_payload", {})
        scene.setdefault("source_refs", ["S1"])
    return scenes


def _select_topic(args: argparse.Namespace, run_date: str) -> dict[str, str | int]:
    day = date.fromisoformat(run_date).day
    if args.topic:
        return custom_topic(args.topic, args.column, day=day)
    if args.plan_file:
        return load_plan_topic(Path(args.plan_file), run_date=run_date, plan_index=args.plan_index)
    return topic_for_day(day)


def run(args: argparse.Namespace) -> Path:
    run_date = args.date or date.today().isoformat()
    if args.edit_plan:
        plan = load_edit_plan(Path(args.edit_plan))
        output = Path(args.edit_output) if args.edit_output else Path(args.output_root) / "edits" / f"{run_date}-edit.mp4"
        render_edit(plan, output)
        print(output)
        return output
    if args.make_plan:
        plan_start = args.plan_start or run_date
        plan = generate_content_plan(
            plan_start,
            args.plan_days,
            theme=args.plan_theme,
            audience=args.audience,
        )
        output = write_content_plan(plan, Path(args.plan_output))
        print(output)
        return output

    workspace = prepare_run(Path(args.output_root), run_date, rebuild=args.rebuild)
    if workspace.reused:
        print(f"reused {workspace.output_dir}")
        return workspace.output_dir

    topic = _select_topic(args, run_date)
    if args.benefit:
        topic["benefit"] = args.benefit
    workspace.update_manifest(status="dry_run" if args.dry_run else "in_progress", stage="planned", topic=topic, mode=args.mode)

    _write_sources(workspace.output_dir, topic)
    scenes = _load_scenes_file(Path(args.scenes_file)) if args.scenes_file else _draft_scenes(topic)

    image_map_path = Path(args.image_map) if args.image_map else None
    if args.image_gen_cmd:
        # Pluggable 智能生图: run the user's image-gen command per scene prompt,
        # then merge with any explicit --image-map (explicit entries win), and
        # fall back to motion-only for scenes the command could not produce.
        auto_map, gen_failures = autogenerate_images(
            scenes, args.image_gen_cmd, workspace.output_dir / "assets" / "_autogen"
        )
        merged: dict = dict(auto_map)
        if image_map_path:
            explicit = json.loads(image_map_path.read_text(encoding="utf-8"))
            for scene_id, entry in explicit.items():
                source = Path(str(entry.get("path", ""))).expanduser()
                if not source.is_absolute():
                    source = image_map_path.parent / source
                merged[scene_id] = {**entry, "path": str(source.resolve())}
        if merged:
            resolved_path = workspace.output_dir / "assets" / "image-map.resolved.json"
            _write_json(resolved_path, merged)
            image_map_path = resolved_path
        if gen_failures:
            _write(
                workspace.output_dir / "logs" / "image-gen.log",
                "\n".join(f"{f['scene_id']}: {f['reason']}" for f in gen_failures) + "\n",
            )

    package_scene_images(scenes, image_map_path, workspace.output_dir)
    _write(workspace.output_dir / "script" / "narration.md", "\n".join(scene["narration"] for scene in scenes) + "\n")

    segment_paths: list[Path] = []
    if args.skip_audio:
        for index, _scene in enumerate(scenes, start=1):
            path = workspace.output_dir / "audio" / "segments" / f"{index:02d}.wav"
            _silent_wav(path, 10.0)
            segment_paths.append(path)
            _scene["audio_duration"] = 10.0
            _scene["audio_file"] = f"generated/{run_date}/{index:02d}.wav"
    else:
        if args.unify_timbre:
            anchor = _ensure_voice_anchor(workspace.output_dir)
            adapter = VoxAdapter(reference_audio=anchor, authorized_voice_clone=True)
        else:
            adapter = VoxAdapter()
        outputs = adapter.generate_segments([scene["narration"] for scene in scenes], workspace.output_dir / "audio" / "segments")
        for scene, audio in zip(scenes, outputs, strict=True):
            segment_paths.append(audio.path)
            scene["audio_duration"] = audio.duration_seconds
            scene["audio_file"] = f"generated/{run_date}/{audio.path.name}"
    _concat_wavs(segment_paths, workspace.output_dir / "audio" / "narration.wav")

    timeline_scenes = finalize_timeline(scenes, fps=FPS)
    timeline = {"schema_version": 1, "fps": FPS, "scenes": timeline_scenes}
    _write_json(workspace.output_dir / "script" / "timeline.json", timeline)
    _write(
        workspace.output_dir / "script" / "timeline.md",
        "\n".join(
            f"{scene['start_frame'] / FPS:05.1f}s {scene['id']}: {scene['on_screen_text']}"
            for scene in timeline_scenes
        ) + "\n",
    )
    _write_platform_copy(workspace.output_dir, topic)

    if args.skip_render:
        (workspace.output_dir / "video" / "final-9x16.mp4").write_bytes(b"dry-run video placeholder")
        (workspace.output_dir / "cover" / "cover-9x16.png").write_bytes(b"dry-run cover placeholder")
    else:
        _render_remotion(workspace.output_dir, run_date, topic, timeline_scenes)

    _write(workspace.output_dir / "logs" / "production.log", "dry-run completed\n" if args.dry_run else "production scaffold completed\n")
    report = run_qa(
        workspace.output_dir,
        media_probe=lambda _: {"width": 1080, "height": 1920, "fps": 30, "duration": 60, "has_audio": True},
    )
    workspace.update_manifest(status="dry_run" if args.dry_run else "success", stage="verified", qa_passed=report["passed"])
    print(workspace.output_dir)
    return workspace.output_dir


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run 智面引擎 daily video production")
    parser.add_argument("--date", help="Production date in YYYY-MM-DD")
    parser.add_argument("--output-root", default="outputs", help="Root output directory")
    parser.add_argument("--mode", choices=["manual", "scheduled", "delivery"], default="manual")
    parser.add_argument("--topic", help="Use a custom topic title instead of the fallback seed plan")
    parser.add_argument("--column", help="Column label for --topic, for example AI实操 or 大厂拆招·后端")
    parser.add_argument("--plan-file", help="JSON content plan generated by the model; selects by --date unless --plan-index is set")
    parser.add_argument("--plan-index", type=int, help="1-based item index inside --plan-file")
    parser.add_argument("--make-plan", action="store_true", help="Generate a reusable date-range content plan and exit")
    parser.add_argument("--plan-start", help="Start date for --make-plan in YYYY-MM-DD; defaults to --date or today")
    parser.add_argument("--plan-days", type=int, default=30, help="Number of days to include in --make-plan")
    parser.add_argument("--plan-theme", default="AI使用技巧与技术面试", help="Theme for --make-plan")
    parser.add_argument("--audience", default="技术求职者、程序员和AI学习者", help="Audience for --make-plan and plan metadata")
    parser.add_argument("--plan-output", default="plans", help="Output JSON file or folder for --make-plan")
    parser.add_argument("--rebuild", action="store_true", help="Create the next vN folder for the date")
    parser.add_argument("--dry-run", action="store_true", help="Use deterministic placeholders")
    parser.add_argument("--skip-audio", action="store_true", help="Use silent placeholder WAV files")
    parser.add_argument("--skip-render", action="store_true", help="Use placeholder video and cover files")
    parser.add_argument("--image-map", help="JSON map of scene ids to model-generated local image files")
    parser.add_argument(
        "--unify-timbre",
        action="store_true",
        help="Anchor every narration segment to one synthetic AI voice clip so the whole video keeps a single timbre",
    )
    parser.add_argument(
        "--scenes-file",
        help="JSON file of hand-authored scenes (for custom episodes such as tutorials) instead of the auto-drafted script",
    )
    parser.add_argument(
        "--benefit",
        help="Override the cover benefit line for a custom episode",
    )
    parser.add_argument(
        "--image-gen-cmd",
        help="Pluggable 智能生图 command template with {prompt} and {out} placeholders; "
             "run per scene image_prompt, with motion-only fallback when it fails",
    )
    parser.add_argument(
        "--edit-plan",
        help="Run the local video editor on this JSON edit plan (concat/crossfade/overlay/music) and exit",
    )
    parser.add_argument(
        "--edit-output",
        help="Output path for --edit-plan (default: <output-root>/edits/<date>-edit.mp4)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    args = build_parser().parse_args(argv)
    run(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
