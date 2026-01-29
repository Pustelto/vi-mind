import { useState, useCallback } from 'react';
import type { MindMapNode, NodeLayout } from '../types';
import { useNodeStore, useUIStore } from '../stores';
import { NodeEditor } from './NodeEditor';

interface Props {
  node: MindMapNode;
  layout: NodeLayout;
  isSelected: boolean;
}

const MIN_NODE_WIDTH = 80;
const MAX_NODE_WIDTH = 250;
const NODE_PADDING_X = 24;
const NODE_PADDING_Y = 16;
const LINE_HEIGHT = 20;
const CHAR_WIDTH = 8;
const TEXT_PADDING = 12;

function calculateNodeDimensions(content: string): { width: number; height: number } {
  const lines = content.split('\n');
  const maxLineLength = Math.max(...lines.map((line) => line.length), 1);

  const textWidth = maxLineLength * CHAR_WIDTH;
  const width = Math.min(MAX_NODE_WIDTH, Math.max(MIN_NODE_WIDTH, textWidth + NODE_PADDING_X));

  const wrappedLineCount = lines.reduce((count, line) => {
    const charsPerLine = Math.floor((width - NODE_PADDING_X) / CHAR_WIDTH);
    const lineWraps = Math.max(1, Math.ceil(line.length / charsPerLine) || 1);
    return count + lineWraps;
  }, 0);

  const height = Math.max(40, wrappedLineCount * LINE_HEIGHT + NODE_PADDING_Y);

  return { width, height };
}

function wrapText(text: string, maxWidth: number, charWidth: number): string[] {
  const lines = text.split('\n');
  const wrappedLines: string[] = [];
  const charsPerLine = Math.floor(maxWidth / charWidth);

  for (const line of lines) {
    if (line.length <= charsPerLine) {
      wrappedLines.push(line || ' ');
    } else {
      const words = line.split(/(\s+)/);
      let currentLine = '';

      for (const word of words) {
        if (currentLine.length + word.length <= charsPerLine) {
          currentLine += word;
        } else if (word.length > charsPerLine) {
          if (currentLine) {
            wrappedLines.push(currentLine);
            currentLine = '';
          }
          let remaining = word;
          while (remaining.length > charsPerLine) {
            wrappedLines.push(remaining.slice(0, charsPerLine - 1) + '-');
            remaining = remaining.slice(charsPerLine - 1);
          }
          currentLine = remaining;
        } else {
          if (currentLine.trim()) {
            wrappedLines.push(currentLine);
          }
          currentLine = word.trimStart();
        }
      }

      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    }
  }

  return wrappedLines.length > 0 ? wrappedLines : [' '];
}

export function MindMapNodeComponent({ node, layout, isSelected }: Props) {
  const mode = useUIStore((state) => state.mode);
  const selectNode = useNodeStore((state) => state.selectNode);
  const updateNodeContent = useNodeStore((state) => state.updateNodeContent);
  const exitInsertMode = useUIStore((state) => state.exitInsertMode);
  const isEditing = isSelected && mode === 'insert';

  const [editingDimensions, setEditingDimensions] = useState<{ width: number; height: number } | null>(
    null
  );

  const handleClick = () => {
    selectNode(node.id);
  };

  const handleContentChange = useCallback((content: string) => {
    setEditingDimensions(calculateNodeDimensions(content));
  }, []);

  const deleteNode = useNodeStore((state) => state.deleteNode);
  const service = useNodeStore((state) => state.service);

  const handleEditComplete = useCallback(
    async (finalContent: string) => {
      const trimmedContent = finalContent.trim();
      if (trimmedContent === '') {
        const parentId = service ? await service.getParentId(node.id) : null;
        const result = await deleteNode(node.id);
        if (result.ok && parentId) {
          useNodeStore.getState().selectNode(parentId);
        }
      } else {
        updateNodeContent(node.id, trimmedContent);
      }
      setEditingDimensions(null);
      exitInsertMode();
    },
    [node.id, updateNodeContent, exitInsertMode, deleteNode, service]
  );


  const { position } = layout;
  const { width, height } =
    isEditing && editingDimensions ? editingDimensions : { width: layout.width, height: layout.height };

  const textLines = wrapText(node.content, width - TEXT_PADDING * 2, CHAR_WIDTH);
  const textStartY = height / 2 - ((textLines.length - 1) * LINE_HEIGHT) / 2;

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <rect
        width={width}
        height={height}
        rx={6}
        style={{
          fill: isSelected ? '#eff6ff' : '#ffffff',
          stroke: isSelected ? '#3b82f6' : '#d1d5db',
          strokeWidth: 2,
        }}
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
          x={TEXT_PADDING}
          y={textStartY}
          dominantBaseline="middle"
          style={{ fontSize: '14px', fill: '#1f2937', pointerEvents: 'none', fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {textLines.map((line, i) => (
            <tspan key={i} x={TEXT_PADDING} dy={i === 0 ? 0 : LINE_HEIGHT}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}
