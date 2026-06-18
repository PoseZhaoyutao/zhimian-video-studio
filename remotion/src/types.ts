import type {Caption} from "@remotion/captions";
import {z} from "zod";

export const sceneSchema = z.object({
  id: z.string(),
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
  narration: z.string(),
  onScreenText: z.string(),
  caption: z.string(),
  visualType: z.enum(["editorial", "code", "process", "flow", "comparison", "formula"]),
  visualPayload: z.record(z.string(), z.unknown()).default({}),
  audioFile: z.string().optional(),
});

export const videoSchema = z.object({
  title: z.string(),
  column: z.string(),
  episode: z.string(),
  benefit: z.string(),
  scenes: z.array(sceneSchema).min(1),
  captions: z.array(
    z.object({
      text: z.string(),
      startMs: z.number(),
      endMs: z.number(),
      timestampMs: z.number().nullable(),
      confidence: z.number().nullable(),
    }),
  ),
});

export type Scene = z.infer<typeof sceneSchema>;
export type VideoProps = z.infer<typeof videoSchema>;
export type TimelineCaption = Caption;
