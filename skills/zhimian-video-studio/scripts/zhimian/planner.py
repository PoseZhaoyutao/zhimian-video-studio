from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any


PlanItem = dict[str, Any]


def infer_column(title: str) -> str:
    """Infer a stable column label when the user only gives a topic."""
    lowered = title.lower()
    if any(keyword in title for keyword in ["Redis", "MySQL", "TCP", "缓存", "队列", "接口", "后端", "系统设计"]):
        return "大厂拆招·后端"
    if any(keyword in title for keyword in ["算法", "复杂度", "Attention", "RAG", "LoRA", "Top-K", "模型", "训练"]):
        return "大厂拆招·算法"
    if any(keyword in title for keyword in ["简历", "求职", "面试", "项目"]):
        return "AI×求职"
    if "ai" in lowered or "agent" in lowered or "提示词" in title or "模型" in title:
        return "AI实操"
    return "自定义内容"


def custom_topic(title: str, column: str | None = None, day: int = 1, **extra: Any) -> PlanItem:
    if not title.strip():
        raise ValueError("topic title must not be empty")
    topic: PlanItem = {
        "day": day,
        "column": column or infer_column(title),
        "title": title.strip(),
    }
    topic.update({key: value for key, value in extra.items() if value not in (None, "")})
    return topic


def generate_content_plan(
    start_date: str | date,
    days: int,
    *,
    theme: str = "AI使用技巧与技术面试",
    audience: str = "技术求职者、程序员和AI学习者",
    seeds: list[PlanItem] | tuple[PlanItem, ...] = (),
) -> list[PlanItem]:
    """Create a reusable planning scaffold for a date range.

    This is deliberately deterministic. In real Codex usage, the model can edit the
    generated JSON plan before passing it back to the production workflow.
    """
    if days <= 0:
        raise ValueError("days must be positive")
    start = date.fromisoformat(start_date) if isinstance(start_date, str) else start_date
    if not seeds:
        seeds = _DEFAULT_SEEDS

    plan: list[PlanItem] = []
    for offset in range(days):
        seed = dict(seeds[offset % len(seeds)])
        planned_date = start + timedelta(days=offset)
        title = seed["title"]
        column = seed.get("column") or infer_column(title)
        plan.append(
            {
                "date": planned_date.isoformat(),
                "day": offset + 1,
                "column": column,
                "title": title,
                "audience": audience,
                "theme": theme,
                "angle": seed.get("angle") or f"围绕「{theme}」给出一个可直接复用的技术短视频切口。",
                "source_queries": seed.get("source_queries")
                or [title, f"{title} official documentation", f"{title} interview follow up"],
                "visual_brief": seed.get("visual_brief")
                or "至少使用一个流程/对比/公式类动画，不做纯文字堆叠。",
            }
        )
    return plan


def write_content_plan(plan: list[PlanItem], output: Path) -> Path:
    if output.suffix.lower() == ".json":
        json_path = output
        json_path.parent.mkdir(parents=True, exist_ok=True)
    else:
        first = str(plan[0]["date"])
        last = str(plan[-1]["date"])
        folder = output / f"{first}_to_{last}"
        folder.mkdir(parents=True, exist_ok=True)
        json_path = folder / "content-plan.json"
        markdown_path = folder / "content-plan.md"
        markdown_path.write_text(_plan_markdown(plan), encoding="utf-8")

    json_path.write_text(json.dumps({"items": plan}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return json_path


def load_plan_topic(path: Path, *, run_date: str | None = None, plan_index: int | None = None) -> PlanItem:
    payload = json.loads(path.read_text(encoding="utf-8"))
    items = payload.get("items", payload if isinstance(payload, list) else None)
    if not isinstance(items, list) or not items:
        raise ValueError("plan file must be a non-empty list or contain an items list")

    selected: Any
    if plan_index is not None:
        if plan_index <= 0 or plan_index > len(items):
            raise ValueError("plan index out of range")
        selected = items[plan_index - 1]
    elif run_date:
        selected = next((item for item in items if str(item.get("date")) == run_date), None)
        if selected is None:
            raise ValueError(f"plan file has no item for {run_date}")
    else:
        selected = items[0]

    if not isinstance(selected, dict):
        raise ValueError("selected plan item must be an object")
    title = str(selected.get("title", "")).strip()
    if not title:
        raise ValueError("selected plan item must contain title")
    day = int(selected.get("day") or plan_index or 1)
    extra = {key: value for key, value in selected.items() if key not in {"title", "column", "day"}}
    return custom_topic(title, str(selected.get("column") or infer_column(title)), day=day, **extra)


def _plan_markdown(plan: list[PlanItem]) -> str:
    lines = [
        "# 内容规划",
        "",
        "| 日期 | 栏目 | 标题 | 视觉建议 |",
        "| --- | --- | --- | --- |",
    ]
    for item in plan:
        lines.append(
            f"| {item['date']} | {item['column']} | {item['title']} | {item.get('visual_brief', '')} |"
        )
    return "\n".join(lines) + "\n"


_DEFAULT_SEEDS: tuple[PlanItem, ...] = (
    {
        "column": "AI实操",
        "title": "把一个模糊需求变成可验收提示词",
        "angle": "用任务、上下文、约束、验收四块，把随口一句话改造成可执行提示词。",
        "visual_brief": "用流程动画展示需求从模糊到可验收的四步拆解。",
    },
    {
        "column": "大厂拆招·算法",
        "title": "Attention为什么要做缩放，复杂度怎么算",
        "angle": "从方差、softmax饱和和O(n²d)复杂度回答面试追问。",
        "visual_brief": "用公式揭示和矩阵流动动画解释QKᵀ与√d。",
    },
    {
        "column": "大厂拆招·后端",
        "title": "Redis缓存穿透、击穿、雪崩怎么区分",
        "angle": "用流量路径和故障传播区分三个缓存高频追问。",
        "visual_brief": "用流量粒子和红色故障节点展示请求如何打到数据库。",
    },
    {
        "column": "AI实操",
        "title": "如何让AI回答时带来源、可复查、少幻觉",
        "angle": "把AI输出从像聊天改成像研究记录，强调来源链和复核点。",
        "visual_brief": "用证据链卡片依次入场，突出来源、摘录、结论分离。",
    },
    {
        "column": "AI×求职",
        "title": "用AI模拟技术面试连续追问",
        "angle": "让模型扮演面试官，不直接给答案，而是追问边界、复杂度和取舍。",
        "visual_brief": "用左右对比动画展示低质量问答和高质量追问链。",
    },
    {
        "column": "大厂拆招·系统设计",
        "title": "短视频推荐流如何拆成召回、排序、重排",
        "angle": "用系统链路解释推荐系统常见分层，而不是背术语。",
        "visual_brief": "用三段管线动画展示候选集如何一步步变少。",
    },
)
