import type { MindMapNode, NodeLayout } from '../types';
import { useNodeStore, useUIStore } from '../stores';
import { NodeEditor } from './NodeEditor';

interface Props {
  node: MindMapNode;
  layout: NodeLayout;
  isSelected: boolean;
}

export function MindMapNodeComponent({ node, layout, isSelected }: Props) {
  const mode = useUIStore((state) => state.mode);
  const selectNode = useNodeStore((state) => state.selectNode);
  const updateNodeContent = useNodeStore((state) => state.updateNodeContent);
  const exitInsertMode = useUIStore((state) => state.exitInsertMode);
  const isEditing = isSelected && mode === 'insert';

  const handleClick = () => {
    selectNode(node.id);
  };

  const handleContentChange = (content: string) => {
    updateNodeContent(node.id, content);
  };

  const handleEditComplete = () => {
    exitInsertMode();
  };

  const { position, width, height } = layout;

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={handleClick}
      className="cursor-pointer"
    >
      <rect
        width={width}
        height={height}
        rx={6}
        className={`fill-white stroke-2 transition-colors ${
          isSelected ? 'stroke-blue-500 fill-blue-50' : 'stroke-gray-300 hover:stroke-gray-400'
        }`}
      />
      {isEditing ? (
        <NodeEditor
          content={node.content}
          width={width}
          height={height}
          onChange={handleContentChange}
          onComplete={handleEditComplete}
        />
      ) : (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm fill-gray-800 pointer-events-none"
          style={{ fontSize: '14px' }}
        >
          {node.content}
        </text>
      )}
    </g>
  );
}
