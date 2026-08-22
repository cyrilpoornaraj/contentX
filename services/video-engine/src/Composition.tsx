import { AbsoluteFill, useCurrentFrame, Sequence, interpolate, Audio, staticFile } from 'remotion';
import { UniversalVisualizer, Node, Edge } from './UniversalVisualizer';
import { ReelProps } from './Root';

export const DynamicReel = ({ reel_title, bgm_track = 'bgm1.mp3', scenes = [] }: ReelProps) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill className="bg-[#0a0c10] text-white font-sans flex flex-col">

      {/* 🎵 BACKGROUND MUSIC COMPONENT */}
      {bgm_track && (
        <Audio src={staticFile(`audio/${bgm_track}`)} volume={0.15} />
      )}

      <div className="h-[15%] w-full flex items-end justify-center px-12 pb-2 z-50">
        <h1 className="text-4xl font-black text-center text-gray-100 tracking-tight leading-snug w-full">
          {reel_title}
        </h1>
      </div>

      <div className="h-[70%] w-full relative">
        {(scenes || []).map((scene, index) => {
          const sceneDuration = 100; // 20 seconds total pacing
          const startFrame = index * sceneDuration;
          const sceneFrame = frame - startFrame;

          const smoothFade = interpolate(sceneFrame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const smoothSlide = interpolate(sceneFrame, [0, 15], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const exitOpacity = interpolate(sceneFrame, [sceneDuration - 10, sceneDuration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          const rawCode = scene.visual_data?.text_lines?.join('\n') || '';
          const charsVisible = Math.floor(interpolate(sceneFrame, [0, 40], [0, rawCode.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const typedCode = rawCode.slice(0, charsVisible);

          return (
            <Sequence key={index} from={startFrame} durationInFrames={sceneDuration}>
              <div
                className="absolute inset-0 flex flex-col justify-center items-center px-6 w-full h-full"
                style={{
                  transform: scene.visual_type !== 'UNIVERSAL_GRAPH' ? `translateY(${smoothSlide}px)` : 'none',
                  opacity: scene.visual_type !== 'UNIVERSAL_GRAPH' ? (smoothFade * exitOpacity) : exitOpacity
                }}
              >
                {/* MAIN VISUAL CONTENT */}
                {scene.visual_type === 'TEXT_REVEAL' && scene.visual_data?.text_lines && (
                  <div className="flex flex-col items-center justify-center gap-8 w-full px-8 mb-8">
                    {scene.visual_data.text_lines.map((line, i) => {
                      const parts = line.split(':');
                      return (
                        <h2 key={i} className="font-bold text-center leading-snug break-words w-full text-4xl text-gray-200">
                          {parts.length > 1 ? (
                            <>
                              <span className="text-[#58a6ff]">{parts[0]}:</span>
                              {parts.slice(1).join(':')}
                            </>
                          ) : (
                            line
                          )}
                        </h2>
                      );
                    })}
                  </div>
                )}

                {scene.visual_type === 'CODE_BLOCK' && (
                  <div className="bg-[#0d1117] border border-[#30363d] p-8 rounded-2xl shadow-2xl w-[92%] min-h-[280px] max-w-full relative overflow-hidden text-left mx-auto flex flex-col justify-center mb-8">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#3fb950] to-[#58a6ff]"></div>
                    <pre className="text-[20px] text-[#c9d1d9] font-fira leading-relaxed whitespace-pre-wrap break-words">
                      {typedCode}
                      <span className="animate-pulse border-r-4 border-gray-400 ml-1"></span>
                    </pre>
                  </div>
                )}

                {scene.visual_type === 'CODE_WALKTHROUGH' && scene.visual_data?.text_lines && (
                  <div className="bg-[#0d1117] border border-[#30363d] py-8 px-6 rounded-3xl shadow-2xl w-[94%] min-h-[280px] relative text-left mx-auto flex flex-col justify-center overflow-hidden mb-8">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#3fb950] to-[#58a6ff]"></div>
                    {scene.visual_data.text_lines.map((line, i) => {
                      const lineFrame = sceneFrame - (i * 5);
                      const lineFade = interpolate(lineFrame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

                      const annotationFrame = sceneFrame - (i * 10) - 15;
                      const annotationFade = interpolate(annotationFrame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                      const isActive = annotationFrame > 0;
                      const annotation = scene.visual_data?.annotations?.find(a => a.line_index === i);

                      return (
                        <div key={i} className="flex items-center w-full min-h-[42px] relative my-[3px]" style={{ opacity: lineFade }}>
                          <div className={`flex items-center px-4 py-[8px] rounded-lg transition-colors duration-300 min-w-0 ${annotation ? 'w-[58%] shrink-0' : 'w-full'} ${isActive && annotation ? 'bg-[#1f2937]/90 shadow-sm' : 'bg-transparent'}`}>
                            <pre className={`text-[20px] font-fira m-0 leading-snug whitespace-pre-wrap break-words ${isActive && annotation ? 'text-white' : 'text-[#8b949e]'}`}>{line}</pre>
                          </div>
                          {annotation && (
                            <div className="w-[42%] flex items-center pl-3 min-w-0 shrink-0" style={{ opacity: annotationFade }}>
                              <span className="text-[22px] text-[#58a6ff] mr-2 shrink-0 font-bold">→</span>
                              <span className="text-[20px] text-[#58a6ff] font-bold font-fira tracking-wide break-words whitespace-pre-wrap leading-tight">
                                {annotation.label}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {scene.visual_type === 'UNIVERSAL_GRAPH' && (
                  <div className="w-full h-full mb-8">
                    <UniversalVisualizer
                      nodes={scene.visual_data?.nodes as Node[]}
                      edges={scene.visual_data?.edges as Edge[]}
                    />
                  </div>
                )}

                {/* 🗣️ CAPTION UI (Displays the spoken script) */}
                {scene.spoken_script && (
                  <div className="absolute bottom-6 w-full px-10 flex justify-center z-50">
                    <div className="bg-black/85 border border-gray-700 backdrop-blur-sm text-gray-100 text-[26px] font-medium py-4 px-6 rounded-2xl text-center leading-snug max-w-[90%] shadow-2xl tracking-wide">
                      {scene.spoken_script}
                    </div>
                  </div>
                )}
              </div>
            </Sequence>
          );
        })}
      </div>

      <div className="h-[15%] w-full flex items-start justify-center pt-10 z-50">
        <div className="text-[#8b949e] font-fira font-bold text-3xl opacity-80">
          @codewithcyril
        </div>
      </div>

    </AbsoluteFill>
  );
};