import { Composition } from 'remotion';
import { DynamicReel } from './Composition';
import './index.css';

export type Scene = {
  visual_type: string;
  spoken_script: string;
  visual_data: {
    text_lines?: string[];
    annotations?: {
      line_index: number;
      label: string;
    }[];
    nodes?: {
      id: string;
      label: string;
      x: number;
      y: number;
      shape: 'circle' | 'rectangle' | 'pill';
      color: string;
    }[];
    edges?: {
      from: string;
      to: string;
    }[];
  };
};

export type ReelProps = {
  reel_title: string;
  bgm_track?: string;
  scenes: Scene[];
};

export const RemotionRoot = () => {
  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap');
                .font-fira { font-family: 'Fira Code', monospace; }
            `}</style>

      <Composition
        id="MyComp"
        component={DynamicReel}
        fps={30}
        width={1080}
        height={1920}
        // FIXED: 100 frames per scene = EXACTLY 20 seconds total length
        calculateMetadata={({ props }) => {
          const sceneCount = props.scenes && props.scenes.length > 0 ? props.scenes.length : 6;
          return {
            durationInFrames: sceneCount * 100
          };
        }}
        defaultProps={{
          reel_title: "Fallback Title",
          scenes: [
            {
              visual_type: "TEXT_REVEAL",
              spoken_script: "System Online",
              visual_data: { text_lines: ["System Online"] }
            }
          ]
        }}
      />
    </>
  );
};