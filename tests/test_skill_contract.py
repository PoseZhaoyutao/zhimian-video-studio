from pathlib import Path


ROOT = Path(__file__).parents[1]
SKILL = ROOT / "skills" / "zhimian-video-studio" / "SKILL.md"


def test_skill_exists_and_is_discoverable():
    text = SKILL.read_text(encoding="utf-8")
    assert text.startswith("---\nname: zhimian-video-studio\n")
    frontmatter = text.split("---", 2)[1]
    assert "description: Use when" in frontmatter
    for trigger in ["生成今天的视频", "规划未来一周内容", "指定主题生成视频", "调用AI科普视频Skill", "重做今天的视频"]:
        assert trigger in text


def test_skill_declares_required_output_contract():
    text = SKILL.read_text(encoding="utf-8")
    for required in ["VoxCPM2", "Remotion", "timeline.json", "outputs/YYYY-MM-DD", "content-plan.json", "flow", "comparison", "formula", "image generation", "assets/image-plan.json", "2–4"]:
        assert required in text


def test_frontmatter_is_minimal_and_searchable():
    text = SKILL.read_text(encoding="utf-8")
    frontmatter = text.split("---", 2)[1].strip().splitlines()
    keys = [line.split(":", 1)[0] for line in frontmatter if ":" in line]
    assert keys == ["name", "description"]
    assert len("\n".join(frontmatter)) < 1024
    assert "Use when" in frontmatter[1]


def test_required_reference_files_exist():
    skill_dir = SKILL.parent
    for relative in [
        "references/content-calendar.md",
        "references/editorial-style.md",
        "references/visual-system.md",
        "references/generative-visuals.md",
        "references/evidence-visuals.md",
        "schemas/timeline.schema.json",
        "schemas/manifest.schema.json",
    ]:
        assert (skill_dir / relative).exists()


def test_skill_requires_web_tutorial_and_experiment_visual_search():
    text = SKILL.read_text(encoding="utf-8")
    for required in [
        "references/evidence-visuals.md",
        "research/visual-search.md",
        "assets/evidence-visuals.json",
        "tutorial",
        "comparison",
        "experiment",
        "source_url",
        "rights_basis",
    ]:
        assert required in text


def test_skill_keeps_safety_and_delivery_boundaries():
    text = SKILL.read_text(encoding="utf-8")
    for required in [
        "不得自动发布",
        "未经明确授权不得克隆真人音色",
        "不得伪造来源",
        "质量检查失败不得宣称成功",
    ]:
        assert required in text


def test_skill_defaults_to_male_narration_and_generated_visuals_with_fallback():
    text = SKILL.read_text(encoding="utf-8")
    for required in [
        "professional male",
        "2–4",
        "image-generation tool",
        "motion-only fallback",
    ]:
        assert required in text
