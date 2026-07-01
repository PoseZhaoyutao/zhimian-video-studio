import json
from pathlib import Path

from zhimian.calendar import TOPICS, topic_for_day
from zhimian.planner import custom_topic, generate_content_plan, load_plan_topic, write_content_plan


BANNED_INTERVIEW_COLUMNS = {"大厂拆招·后端", "大厂拆招·系统设计"}
BANNED_NON_AI_INTERVIEW_TERMS = ["Redis", "MySQL", "TCP", "缓存", "队列", "接口", "后端", "系统设计", "推荐流"]


def test_fallback_seed_plan_has_30_compatibility_slots():
    assert len(TOPICS) == 30
    assert all(item["day"] == index for index, item in enumerate(TOPICS, start=1))
    assert all(item["title"] for item in TOPICS)


def test_first_month_interview_plan_only_keeps_ai_algorithm_topics():
    assert len(TOPICS) == 30
    assert all(item["column"] == "大厂拆招·AI算法" for item in TOPICS)
    assert all(item["column"] not in BANNED_INTERVIEW_COLUMNS for item in TOPICS)
    for item in TOPICS:
        assert not any(term in item["title"] for term in BANNED_NON_AI_INTERVIEW_TERMS)


def test_calendar_rotates_after_day_30():
    assert topic_for_day(1) == TOPICS[0]
    assert topic_for_day(31) == TOPICS[0]
    assert topic_for_day(60) == TOPICS[29]


def test_calendar_rejects_non_positive_days():
    try:
        topic_for_day(0)
    except ValueError as exc:
        assert "positive" in str(exc)
    else:
        raise AssertionError("day zero must be rejected")


def test_generate_content_plan_for_date_range(tmp_path: Path):
    plan = generate_content_plan("2026-07-01", 3, theme="AI科研工具")
    assert [item["date"] for item in plan] == ["2026-07-01", "2026-07-02", "2026-07-03"]
    assert all(item["visual_brief"] for item in plan)
    assert all(item["column"] == "大厂拆招·AI算法" for item in plan)

    json_path = write_content_plan(plan, tmp_path / "plans")
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    assert len(payload["items"]) == 3
    assert json_path.name == "content-plan.json"
    assert json_path.with_suffix(".md").exists()


def test_load_plan_topic_by_date_and_index(tmp_path: Path):
    plan = generate_content_plan("2026-07-01", 2)
    path = write_content_plan(plan, tmp_path / "content-plan.json")

    by_date = load_plan_topic(path, run_date="2026-07-02")
    by_index = load_plan_topic(path, plan_index=1)

    assert by_date["day"] == 2
    assert by_date["title"] == plan[1]["title"]
    assert by_index["title"] == plan[0]["title"]


def test_custom_topic_infers_column_when_missing():
    topic = custom_topic("Redis缓存雪崩怎么排查")
    assert topic["column"] == "自定义内容"


def test_ai_algorithm_topic_infers_interview_column_when_missing():
    topic = custom_topic("Transformer里的Multi-Head Attention为什么要分头")
    assert topic["column"] == "大厂拆招·AI算法"
