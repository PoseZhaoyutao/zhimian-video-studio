from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any


PlanItem = dict[str, Any]


def infer_column(title: str) -> str:
    """Infer a stable column label when the user only gives a topic."""
    lowered = title.lower()
    ai_algorithm_keywords = [
        "AI",
        "算法",
        "复杂度",
        "Attention",
        "Transformer",
        "Self-Attention",
        "RAG",
        "LoRA",
        "Top-K",
        "Top-p",
        "模型",
        "训练",
        "Embedding",
        "Tokenizer",
        "KV Cache",
        "MoE",
        "RLHF",
        "DPO",
        "CNN",
        "RNN",
        "Softmax",
        "Adam",
        "Dropout",
        "BatchNorm",
        "LayerNorm",
        "RoPE",
        "蒸馏",
        "对比学习",
        "梯度",
        "学习率",
        "混合精度",
        "向量检索",
        "召回",
        "重排",
        "AUC",
        "F1",
    ]
    if any(keyword.lower() in lowered for keyword in ai_algorithm_keywords):
        return "大厂拆招·AI算法"
    if any(keyword in title for keyword in ["简历", "求职"]) or ("ai" in lowered and "面试" in title):
        return "AI×求职"
    if "agent" in lowered or "提示词" in title:
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
        "column": "大厂拆招·AI算法",
        "title": "Attention为什么要做缩放，复杂度怎么算",
        "angle": "从方差、softmax饱和和O(n²d)复杂度回答面试追问。",
        "visual_brief": "用公式揭示和矩阵流动动画解释QKᵀ与√d。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Transformer里的Multi-Head Attention为什么要分头",
        "angle": "解释多头如何在不同子空间学习关系，以及参数量和计算量怎么变化。",
        "visual_brief": "用多路并行动画展示QKV拆头、注意力计算和拼接输出。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Self-Attention和RNN、CNN相比优势和代价是什么",
        "angle": "从并行性、长距离依赖、归纳偏置和复杂度四个角度对比。",
        "visual_brief": "用三列对比动画展示序列依赖路径和计算瓶颈。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "LayerNorm为什么常放在残差结构里",
        "angle": "说明归一化如何稳定深层网络训练，并区分Pre-LN和Post-LN。",
        "visual_brief": "用残差流和归一化闸门展示数值分布被拉回稳定区间。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "位置编码为什么需要，RoPE解决了什么问题",
        "angle": "解释Transformer缺少顺序归纳偏置，以及RoPE如何把相对位置信息注入注意力。",
        "visual_brief": "用旋转坐标和token序列轨道展示位置信息进入QK计算。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Softmax数值稳定性为什么要减最大值",
        "angle": "从指数溢出、平移不变性和工程实现说明稳定softmax。",
        "visual_brief": "用数轴和指数曲线展示减最大值前后的溢出差异。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Cross Entropy和KL散度是什么关系",
        "angle": "把监督学习损失拆成真实分布熵和预测分布差距。",
        "visual_brief": "用公式分解动画展示H(P,Q)=H(P)+KL(P||Q)。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "梯度消失和梯度爆炸怎么判断、怎么处理",
        "angle": "从链式法则、梯度范数和训练曲线解释诊断与治理。",
        "visual_brief": "用深层网络阶梯动画展示梯度逐层衰减或放大。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Adam和SGD的区别，为什么Adam收敛更快",
        "angle": "解释一阶矩、二阶矩、自适应学习率和泛化取舍。",
        "visual_brief": "用优化路径对比展示Adam快速贴近谷底、SGD路径更朴素。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Dropout训练和推理阶段有什么区别",
        "angle": "说明随机失活的正则化作用，以及推理时为什么要关闭或缩放。",
        "visual_brief": "用神经元开关动画展示训练随机失活、推理全量启用。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "BatchNorm和LayerNorm适合哪些模型场景",
        "angle": "按归一化维度、batch依赖和序列模型稳定性做区分。",
        "visual_brief": "用张量切片动画对比batch维和feature维的统计范围。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Embedding向量为什么能表示语义",
        "angle": "从分布式表示、上下文共现和向量空间相似性解释语义形成。",
        "visual_brief": "用二维向量空间展示相似词聚类和方向差异。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Word2Vec负采样到底在优化什么",
        "angle": "解释全量softmax太贵，负采样如何把多分类改成若干二分类。",
        "visual_brief": "用正样本和负样本卡片流展示目标函数近似。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "BPE和Tokenizer为什么会影响大模型效果",
        "angle": "从词表、切分粒度、未知词和多语言压缩效率说明影响。",
        "visual_brief": "用文本切片动画展示不同tokenizer的切分结果对比。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "KV Cache为什么能加速大模型自回归推理",
        "angle": "说明历史token的K/V如何复用，以及显存和吞吐的取舍。",
        "visual_brief": "用时间轴展示每步只新增一个token的K/V缓存。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Beam Search和Top-K、Top-p采样怎么选",
        "angle": "按确定性、搜索空间、多样性和任务类型区分解码策略。",
        "visual_brief": "用分叉树动画对比beam保留路径和采样裁剪概率尾部。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "Temperature为什么会改变生成多样性",
        "angle": "解释logits缩放如何改变概率分布尖锐程度。",
        "visual_brief": "用概率柱状图展示低温集中、高温发散。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "LoRA为什么低秩更新也能微调大模型",
        "angle": "解释冻结基座、低秩矩阵分解和参数效率。",
        "visual_brief": "用大矩阵旁路加低秩矩阵的结构动画展示增量更新。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "RAG为什么能减少幻觉，召回和重排怎么评估",
        "angle": "把检索增强拆成召回、重排、上下文注入和答案引用。",
        "visual_brief": "用证据链流程动画展示query到文档再到答案。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "向量检索里余弦相似度和点积怎么选",
        "angle": "从向量归一化、模长含义和排序一致性解释选择。",
        "visual_brief": "用向量夹角和长度对比动画展示两个相似度的差别。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "过拟合和欠拟合怎么从训练曲线判断",
        "angle": "用训练集、验证集损失和泛化误差定位模型容量问题。",
        "visual_brief": "用双曲线图展示训练损失和验证损失分叉。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "学习率Warmup和Cosine Decay解决什么",
        "angle": "解释训练早期稳定性和后期收敛精修的学习率策略。",
        "visual_brief": "用学习率曲线动画展示warmup上升和cosine下降。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "混合精度训练为什么能省显存还不容易崩",
        "angle": "说明FP16/BF16、loss scaling和主权重保存的配合。",
        "visual_brief": "用显存条和精度标签展示计算、梯度和权重的存储差异。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "MoE为什么能扩参数但不等比例增加计算量",
        "angle": "解释专家路由、稀疏激活、负载均衡和通信开销。",
        "visual_brief": "用路由器把token分发到不同专家的流程动画。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "知识蒸馏为什么小模型能学大模型",
        "angle": "说明软标签、温度系数和暗知识如何传递。",
        "visual_brief": "用教师模型输出分布流向学生模型的动画。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "RLHF和DPO分别在优化什么",
        "angle": "区分奖励模型、策略优化和偏好对齐的直接优化路径。",
        "visual_brief": "用两条训练管线对比RLHF多阶段和DPO直接偏好学习。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "评估大模型为什么不能只看单一Benchmark",
        "angle": "从数据泄漏、任务覆盖、主观偏好和线上效果说明评估边界。",
        "visual_brief": "用雷达图展示多维评估比单点分数更稳。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "CNN卷积核参数量和感受野怎么算",
        "angle": "把卷积参数、stride、padding和感受野递推讲清楚。",
        "visual_brief": "用滑动窗口动画展示卷积核扫过特征图和感受野扩大。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "对比学习为什么要设计正样本和负样本",
        "angle": "解释表示学习如何拉近同类、推远异类，以及负样本质量的影响。",
        "visual_brief": "用向量点吸引和排斥动画展示embedding空间变化。",
    },
    {
        "column": "大厂拆招·AI算法",
        "title": "AUC、Precision、Recall、F1分别适合什么分类场景",
        "angle": "按类别不平衡、误报漏报成本和阈值选择解释指标取舍。",
        "visual_brief": "用混淆矩阵和PR曲线动画展示不同指标关注点。",
    },
)