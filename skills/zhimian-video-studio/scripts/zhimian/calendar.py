from __future__ import annotations

from zhimian.planner import generate_content_plan


# Compatibility fallback for older callers. New workflows should call
# generate_content_plan() or pass --topic / --plan-file explicitly.
TOPICS = tuple(
    {"day": item["day"], "column": item["column"], "title": item["title"]}
    for item in generate_content_plan("2026-01-01", 30)
)


def topic_for_day(day: int) -> dict[str, int | str]:
    if day <= 0:
        raise ValueError("day must be positive")
    return TOPICS[(day - 1) % len(TOPICS)]
