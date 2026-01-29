import type { EdgeLayout } from '../types';

interface Props {
  edge: EdgeLayout;
}

export function MindMapEdge({ edge }: Props) {
  const [start, end] = edge.points;

  const midX = (start.x + end.x) / 2;
  const d = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

  return <path d={d} fill="none" style={{ stroke: '#d1d5db', strokeWidth: 2 }} />;
}
