import { interpolate, useCurrentFrame } from 'remotion';

export type Node = {
    id: string;
    label: string;
    x: number;
    y: number;
    shape: 'circle' | 'rectangle' | 'pill';
    color: string;
};
export type Edge = { from: string; to: string };

const sanitize = (str?: string) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

export const UniversalVisualizer = ({ nodes = [], edges = [] }: { nodes?: Node[], edges?: Edge[] }) => {
    const frame = useCurrentFrame();

    // DEFENSIVE FALLBACK: If the AI forgets the lines, we auto-generate them sequentially
    let safeEdges = edges && edges.length > 0 ? edges : [];
    if (safeEdges.length === 0 && nodes && nodes.length > 1) {
        for (let i = 0; i < nodes.length - 1; i++) {
            safeEdges.push({ from: nodes[i].id, to: nodes[i + 1].id });
        }
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {safeEdges.map((edge, index) => {
                    const fromNode = (nodes || []).find(n => sanitize(n.id) === sanitize(edge.from));
                    const toNode = (nodes || []).find(n => sanitize(n.id) === sanitize(edge.to));
                    if (!fromNode || !toNode) return null;

                    const edgeFrame = frame - (index * 10);

                    const drawProgress = interpolate(edgeFrame, [0, 20], [0, 1], {
                        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
                    });

                    const length = Math.sqrt(Math.pow(toNode.x - fromNode.x, 2) + Math.pow(toNode.y - fromNode.y, 2));

                    return (
                        <line
                            key={index}
                            x1={`${fromNode.x}%`} y1={`${fromNode.y}%`}
                            x2={`${toNode.x}%`} y2={`${toNode.y}%`}
                            stroke="#8b949e"
                            strokeWidth="6"
                            strokeDasharray={length * 10}
                            strokeDashoffset={(length * 10) * (1 - drawProgress)}
                            opacity={drawProgress}
                        />
                    );
                })}
            </svg>

            {(nodes || []).map((node, index) => {
                const nodeFrame = frame - (index * 8);

                const smoothFade = interpolate(nodeFrame, [0, 20], [0, 1], {
                    extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
                });

                const smoothSlide = interpolate(nodeFrame, [0, 20], [20, 0], {
                    extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
                });

                let shapeClasses = "rounded-xl px-8 py-5 max-w-sm text-center break-words leading-tight";
                if (node.shape === 'circle') shapeClasses = "rounded-full min-w-[160px] min-h-[160px] aspect-square flex items-center justify-center p-5 text-center break-words leading-tight";
                if (node.shape === 'pill') shapeClasses = "rounded-full px-10 py-4 text-center break-words leading-tight";

                return (
                    <div
                        key={node.id}
                        className={`absolute flex items-center justify-center border-4 text-white font-black text-[26px] shadow-2xl z-10 ${shapeClasses}`}
                        style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            borderColor: node.color,
                            backgroundColor: '#161b22',
                            boxShadow: `0 0 40px ${node.color}40`,
                            transform: `translate(-50%, calc(-50% + ${smoothSlide}px))`,
                            opacity: smoothFade
                        }}
                    >
                        {node.label}
                    </div>
                );
            })}
        </div>
    );
};