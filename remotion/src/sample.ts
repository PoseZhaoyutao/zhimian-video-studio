import type {VideoProps} from "./types";

export const sampleProps: VideoProps = {
  title: "把一个模糊需求变成可验收提示词",
  column: "AI实操",
  episode: "EP.01",
  benefit: "60 秒讲清一个能直接复用的 AI 工作流",
  scenes: [
    {
      id: "hook",
      startFrame: 0,
      durationInFrames: 90,
      narration: "别再只写一句帮我优化一下了。",
      onScreenText: "提示词不是咒语，是验收标准",
      caption: "提示词不是咒语，是验收标准。",
      visualType: "comparison",
      visualPayload: {left: "帮我优化", right: "任务+约束+验收", winner: "right"},
    },
    {
      id: "flow",
      startFrame: 90,
      durationInFrames: 180,
      narration: "把需求拆成任务、上下文、约束和验收四块。",
      onScreenText: "需求如何变成提示词",
      caption: "把需求拆成四块。",
      visualType: "flow",
      visualPayload: {steps: ["任务", "上下文", "约束", "验收"]},
    },
    {
      id: "formula",
      startFrame: 270,
      durationInFrames: 150,
      narration: "最终公式是，清晰任务加上下文，加约束，再加验收。",
      onScreenText: "一条可复用公式",
      caption: "清晰任务加上下文，加约束，再加验收。",
      visualType: "formula",
      visualPayload: {tokens: ["好提示词", "=", "任务", "+", "上下文", "+", "验收"]},
    },
  ],
  captions: [
    {text: "提示词不是咒语，是验收标准。", startMs: 0, endMs: 3000, timestampMs: 0, confidence: 1},
    {text: "把需求拆成四块。", startMs: 3000, endMs: 9000, timestampMs: 3000, confidence: 1},
    {text: "清晰任务加上下文，加约束，再加验收。", startMs: 9000, endMs: 14000, timestampMs: 9000, confidence: 1},
  ],
};
