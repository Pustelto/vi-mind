import { useMemo } from 'react';
import { useNodeStore } from '../stores';
import { calculateLayout } from '../layout/hierarchicalLayout';
import { MindMapNodeComponent } from './MindMapNode';
import { MindMapEdge } from './MindMapEdge';

export function MindMapCanvas() {
  const nodes = useNodeStore((state) => state.nodes);
  const selectedNodeId = useNodeStore((state) => state.selectedNodeId);

  const layout = useMemo(() => calculateLayout(nodes), [nodes]);

  const viewBoxWidth = Math.max(layout.bounds.width, 800);
  const viewBoxHeight = Math.max(layout.bounds.height, 600);

  return (
    <svg className="w-full h-full bg-gray-50" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
      <g className="edges">
        {layout.edges.map((edge) => (
          <MindMapEdge key={`${edge.fromId}-${edge.toId}`} edge={edge} />
        ))}
      </g>
      <g className="nodes">
        {Array.from(layout.nodes.entries()).map(([nodeId, nodeLayout]) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) return null;
          return (
            <MindMapNodeComponent
              key={nodeId}
              node={node}
              layout={nodeLayout}
              isSelected={nodeId === selectedNodeId}
            />
          );
        })}
      </g>
    </svg>
  );
}
