from __future__ import annotations

from pathlib import Path


def build_render_command(
    *,
    remotion_bin: Path,
    entry: Path,
    composition: str,
    output: Path,
    props: Path | None = None,
    codec: str = "h264",
) -> list[str]:
    command = [
        str(remotion_bin),
        "render",
        str(entry),
        composition,
        str(output),
        "--codec",
        codec,
    ]
    if props is not None:
        command.extend(["--props", str(props)])
    return command


def build_still_command(
    *,
    remotion_bin: Path,
    entry: Path,
    composition: str,
    output: Path,
    props: Path | None = None,
    frame: int | None = None,
) -> list[str]:
    command = [str(remotion_bin), "still", str(entry), composition]
    if frame is not None:
        command.extend(["--frame", str(frame)])
    command.append(str(output))
    if props is not None:
        command.extend(["--props", str(props)])
    return command
