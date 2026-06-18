from zhimian.calendar import TOPICS, topic_for_day


def test_calendar_has_30_unique_topics():
    assert len(TOPICS) == 30
    assert len({item["title"] for item in TOPICS}) == 30
    assert all(item["day"] == index for index, item in enumerate(TOPICS, start=1))


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
