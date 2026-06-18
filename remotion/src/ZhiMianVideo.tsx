import {Audio} from "@remotion/media";
import {AbsoluteFill, Sequence, staticFile} from "remotion";
import {CaptionLayer} from "./components/Captions";
import {EditorialFrame} from "./components/EditorialFrame";
import {SceneWipe} from "./components/SceneWipe";
import {categoryColor} from "./design";
import type {VideoProps} from "./types";

export const ZhiMianVideo: React.FC<VideoProps> = (props) => (
  <AbsoluteFill>
    {props.scenes.map((scene) => (
      <Sequence
        key={scene.id}
        from={scene.startFrame}
        durationInFrames={scene.durationInFrames}
        premountFor={30}
      >
        <EditorialFrame scene={scene} column={props.column} title={props.title} />
      </Sequence>
    ))}
    {props.scenes.map((scene) =>
      scene.audioFile ? (
        <Sequence
          key={`audio-${scene.id}`}
          from={scene.startFrame}
          durationInFrames={scene.durationInFrames}
          premountFor={30}
        >
          <Audio src={staticFile(scene.audioFile)} />
        </Sequence>
      ) : null,
    )}
    <CaptionLayer captions={props.captions} column={props.column} />
    {props.scenes.map((scene) => (
      <Sequence
        key={`transition-${scene.id}`}
        from={scene.startFrame}
        durationInFrames={Math.min(25, scene.durationInFrames)}
        premountFor={15}
      >
        <SceneWipe accent={categoryColor(props.column)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
