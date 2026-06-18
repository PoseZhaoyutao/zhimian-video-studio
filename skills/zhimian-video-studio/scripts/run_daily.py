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
from zhimian.planner import custom_topic, generate_content_plan, load_plan_topic, write_content_plan
from zhimian.qa import run_qa
from zhimian.remotion import build_render_command, build_still_command
from zhimian.timeline import finalize_timeline
from zhimian.vox import VoxAdapter
from zhimian.workspace import prepare_run


FPS = 30


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
        "title": str(topic["title"]),
        "column": str(topic["column"]),
        "episode": f"EP.{int(topic['day']):02d}",
        "benefit": "60 秒拆出面试官真正想追问的技术细节",
        "scenes": remotion_scenes,
        "captions": captions,
    }


def _render_remotion(output_dir: Path, run_date: str, topic: dict[str, str | int], scenes: list[dict]) -> None:
    repo_root = _repo_root()
    remotion_root = repo_root / "remotion"
    entry = remotion_root / "src" / "index.ts"
    remotion_bin = _remotion_bin(remotion_root)

    _stage_static_audio(output_dir, remotion_root, run_date, scenes)
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
    angle = str(topic.get("angle") or "把一个具体问题拆成可验证、可复用、可追问的回答框架。")
    return [
        {"id": "hook", "narration": f"今天拆一个高频问题：{title}。别只背答案，我们要看面试官真正想追问什么。", "on_screen_text": title, "caption": title, "visual_type": "comparison", "visual_payload": {"left": "背答案", "right": "讲机制", "winner": "right"}, "source_refs": ["S1"]},
        {"id": "intuition", "narration": "先给直觉：一个好回答，应该从问题入口，一路走到关键变量、底层原因和落地取舍。", "on_screen_text": "先看问题怎么流动", "caption": "先给直觉，再看底层原因。", "visual_type": "flow", "visual_payload": {"steps": ["问题入口", "关键变量", "底层原因", "落地取舍"]}, "source_refs": ["S1"]},
        {"id": "principle", "narration": f"这一期的核心切口是：{angle}", "on_screen_text": "把直觉压成一句公式", "caption": "把直觉压成一句可复查的公式。", "visual_type": "formula", "visual_payload": {"tokens": ["结论", "=", "条件", "+", "机制", "+", "边界"]}, "source_refs": ["S1"]},
        {"id": "followups", "narration": "真正拉开差距的是连续追问：为什么这样设计？复杂度或成本是多少？边界情况会不会翻车？", "on_screen_text": "追问链决定上限", "caption": "真正拉开差距的是连续追问。", "visual_type": "code", "visual_payload": {"code": "Q1: 为什么这样设计？\nQ2: 复杂度 / 成本是多少？\nQ3: 边界情况会不会翻车？"}, "source_refs": ["S1"]},
        {"id": "answer", "narration": "高分回答按四步说：先给结论，再讲原理，然后说明取舍，最后落到工程或面试场景。", "on_screen_text": "结论 · 原理 · 取舍 · 落地", "caption": "高分回答按四步说。", "visual_type": "process", "visual_payload": {"steps": ["结论", "原理", "取舍", "落地"]}, "source_refs": ["S1"]},
        {"id": "mistake", "narration": "最容易失分的地方，是把术语背得很熟，却解释不了为什么、什么时候不用、代价是什么。", "on_screen_text": "别背术语，要讲为什么", "caption": "别背术语，要讲为什么。", "visual_type": "comparison", "visual_payload": {"left": "术语很多", "right": "因果清楚", "winner": "right"}, "source_refs": ["S1"]},
    ]


def _write_platform_copy(output_dir: Path, topic: dict[str, str | int]) -> None:
    title = str(topic["title"])
    copies = {
        "xiaohongshu.md": f"# {title}｜技术面试高频追问\n\n标签：#技术面试 #AI面试 #后端 #算法 #智面引擎\n\n描述：先收藏这一期，按原题、原理、追问、回答骨架复习。\n",
        "douyin.md": f"# 面试官问{title}，别只背答案\n\n标签：#大厂面试 #程序员 #AI学习 #后端 #算法\n\n描述：真正加分的是能解释为什么。你还想看哪个追问？\n",
        "bilibili.md": f"# {title}：大厂技术面试追问链拆解\n\n标签：技术面试,后端开发,算法,AI,求职\n\n描述：本期包含原题、底层原理、连续追问和高分回答骨架。配音为AI生成，仅供学习复盘。\n",
    }
    for filename, content in copies.items():
        _write(output_dir / "copy" / filename, content)


def _select_topic(args: argparse.Namespace, run_date: str) -> dict[str, str | int]:
    day = date.fromisoformat(run_date).day
    if args.topic:
        return custom_topic(args.topic, args.column, day=day)
    if args.plan_file:
        return load_plan_topic(Path(args.plan_file), run_date=run_date, plan_index=args.plan_index)
    return topic_for_day(day)


def run(args: argparse.Namespace) -> Path:
    run_date = args.date or date.today().isoformat()
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
    workspace.update_manifest(status="dry_run" if args.dry_run else "in_progress", stage="planned", topic=topic, mode=args.mode)

    _write(workspace.output_dir / "research" / "sources.md", "[S1] 待替换为当天官方文档、论文或权威源码。\n")
    scenes = _draft_scenes(topic)
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
