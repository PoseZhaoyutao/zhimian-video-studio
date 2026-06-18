import type {VideoProps} from "./types";

export const sampleProps: VideoProps = {
  title: "Attention 为什么要除以 √d？",
  column: "大厂拆招·算法",
  episode: "EP.01",
  benefit: "60 秒讲清面试官真正想追问的细节",
  scenes: [
    {
      id: "hook",
      startFrame: 0,
      durationInFrames: 90,
      narration: "Attention 为什么要除以根号 d？",
      onScreenText: "为什么要除以 √d？",
      caption: "Attention 为什么要除以根号 d？",
      visualType: "editorial",
      visualPayload: {},
    },
    {
      id: "explain",
      startFrame: 90,
      durationInFrames: 210,
      narration: "维度增大时，点积的方差也会增大。",
      onScreenText: "维度 ↑  点积方差 ↑",
      caption: "维度增大时，点积的方差也会增大。",
      visualType: "process",
      visualPayload: {steps: ["Q · K", "方差随 d 墑大", "Softmax 饱和", "÷ √d"]},
    },
  ],
  captions: [
    {text: "Attention 为什么要除以根号 d？", startMs: 0, endMs: 3000, timestampMs: 0, confidence: 1},
    {text: "维度增大时，点积的方差也会增大。", startMs: 3000, endMs: 10000, timestampMs: 3000, confidence: 1},
  ],
};
