import type {CalculateMetadataFunction} from "remotion";
import {Composition, Still} from "remotion";
import {Cover} from "./Cover";
import {sampleProps} from "./sample";
import {videoSchema, type VideoProps} from "./types";
import {ZhiMianVideo} from "./ZhiMianVideo";

const calculateMetadata: CalculateMetadataFunction<VideoProps> = ({props}) => ({
  durationInFrames: Math.max(
    1,
    ...props.scenes.map((scene) => scene.startFrame + scene.durationInFrames),
  ),
  props,
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ZhiMianVideo"
      component={ZhiMianVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={sampleProps}
      schema={videoSchema}
      calculateMetadata={calculateMetadata}
    />
    <Still
      id="ZhiMianCover"
      component={Cover}
      width={1080}
      height={1920}
      defaultProps={sampleProps}
      schema={videoSchema}
    />
  </>
);
