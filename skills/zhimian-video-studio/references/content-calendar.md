# 智面引擎内容规划协议

本 Skill 不再绑定某个账号的固定首月选题。内容选择优先级如下：

1. 用户明确指定主题：直接围绕该主题生成视频。
2. 用户要求“生成某个时间段的内容规划”：先让模型产出 `content-plan.json`，用户可改，随后按日期或序号调用。
3. 用户没有给主题也没有给规划：使用内置种子库兜底，保证自动任务不断档。

## 时间段规划

当用户说“帮我规划未来 7 天/一个月/某个时间段的内容”时，先输出一份可编辑计划，再进入视频生产。计划应包含：

```json
{
  "items": [
    {
      "date": "2026-06-18",
      "day": 1,
      "column": "AI实操",
      "title": "把一个模糊需求变成可验收提示词",
      "audience": "技术求职者、程序员和AI学习者",
      "theme": "AI使用技巧与技术面试",
      "angle": "用任务、上下文、约束、验收四块，把随口一句话改造成可执行提示词。",
      "source_queries": ["prompt engineering official documentation"],
      "visual_brief": "用流程动画展示需求从模糊到可验收的四步拆解。"
    }
  ]
}
```

CLI 可生成一个计划草稿：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --make-plan `
  --plan-start 2026-07-01 `
  --plan-days 14 `
  --plan-theme "AI工具与技术面试" `
  --plan-output plans
```

之后可按日期调用：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-07-03 `
  --plan-file plans/2026-07-01_to_2026-07-14/content-plan.json `
  --mode manual
```

也可按序号调用：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-07-03 `
  --plan-file plans/2026-07-01_to_2026-07-14/content-plan.json `
  --plan-index 3 `
  --mode manual
```

## 指定主题直出

当用户指定“今天做 X”“生成一期关于 X 的视频”时，不需要先生成长计划：

```powershell
python skills/zhimian-video-studio/scripts/run_daily.py `
  --date 2026-07-03 `
  --topic "如何用AI审查一份后端系统设计方案" `
  --column "AI实操" `
  --mode manual
```

## 选题质量规则

- 每个标题必须能落到一个清晰问题，不写“AI很强大”这种泛话题。
- 大厂拆招类必须包含技术细节追问：复杂度、边界、故障、成本、工程取舍。
- AI实操类必须包含可复用工作流：输入、步骤、约束、验收。
- 每条计划都要给 `visual_brief`，指导 Remotion 选择流程、对比、公式或代码动画。
- 自动任务没有用户输入时才使用内置种子库；种子库只是不断档兜底，不是固定首月排期。
