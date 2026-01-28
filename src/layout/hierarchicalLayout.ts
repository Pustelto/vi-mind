import type { MindMapNode, NodeId, NodeLayout, EdgeLayout, LayoutResult } from '../types';

const MIN_NODE_WIDTH = 80;
const MAX_NODE_WIDTH = 250;
const NODE_PADDING_X = 24;
const NODE_PADDING_Y = 16;
const LINE_HEIGHT = 20;
const CHAR_WIDTH = 8;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 20;

interface TreeNode {
  id: NodeId;
  content: string;
  children: TreeNode[];
  width: number;
  height: number;
}

function calculateNodeDimensions(content: string): { width: number; height: number } {
  const lines = content.split('\n');
  const maxLineLength = Math.max(...lines.map((line) => line.length), 1);

  const textWidth = maxLineLength * CHAR_WIDTH;
  const width = Math.min(MAX_NODE_WIDTH, Math.max(MIN_NODE_WIDTH, textWidth + NODE_PADDING_X));

  const wrappedLineCount = lines.reduce((count, line) => {
    const charsPerLine = Math.floor((width - NODE_PADDING_X) / CHAR_WIDTH);
    const lineWraps = Math.max(1, Math.ceil(line.length / charsPerLine));
    return count + lineWraps;
  }, 0);

  const height = Math.max(40, wrappedLineCount * LINE_HEIGHT + NODE_PADDING_Y);

  return { width, height };
}

function buildTree(nodes: MindMapNode[], rootId: NodeId | null): TreeNode | null {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<NodeId | null, MindMapNode[]>();

  for (const node of nodes) {
    const parentId = node.parentId;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(node);
  }

  for (const children of childrenMap.values()) {
    children.sort((a, b) => a.order - b.order);
  }

  function buildNode(nodeId: NodeId): TreeNode | null {
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const children = childrenMap.get(nodeId) ?? [];
    const dimensions = calculateNodeDimensions(node.content);

    return {
      id: node.id,
      content: node.content,
      children: children.map((c) => buildNode(c.id)).filter((n): n is TreeNode => n !== null),
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  const root = rootId ? nodeMap.get(rootId) : nodes.find((n) => n.parentId === null);

  if (!root) return null;
  return buildNode(root.id);
}

function calculateSubtreeHeight(node: TreeNode): number {
  if (node.children.length === 0) {
    return node.height;
  }
  const childrenHeight = node.children.reduce(
    (sum, child) => sum + calculateSubtreeHeight(child) + VERTICAL_SPACING,
    -VERTICAL_SPACING
  );
  return Math.max(node.height, childrenHeight);
}

export function calculateLayout(nodes: MindMapNode[]): LayoutResult {
  const nodeLayouts = new Map<NodeId, NodeLayout>();
  const edges: EdgeLayout[] = [];

  if (nodes.length === 0) {
    return { nodes: nodeLayouts, edges, bounds: { minX: 0, minY: 0, width: 0, height: 0 } };
  }

  const tree = buildTree(nodes, null);
  if (!tree) {
    return { nodes: nodeLayouts, edges, bounds: { minX: 0, minY: 0, width: 0, height: 0 } };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;

  function layoutNode(node: TreeNode, x: number, y: number): void {
    nodeLayouts.set(node.id, {
      nodeId: node.id,
      position: { x, y },
      width: node.width,
      height: node.height,
    });

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + node.width);
    maxY = Math.max(maxY, y + node.height);

    if (node.children.length === 0) return;

    const childrenHeights = node.children.map(calculateSubtreeHeight);
    const totalChildrenHeight = childrenHeights.reduce(
      (sum, h) => sum + h + VERTICAL_SPACING,
      -VERTICAL_SPACING
    );

    let childY = y + node.height / 2 - totalChildrenHeight / 2;
    const childX = x + node.width + HORIZONTAL_SPACING;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childHeight = childrenHeights[i];

      const childNodeY = childY + childHeight / 2 - child.height / 2;

      edges.push({
        fromId: node.id,
        toId: child.id,
        points: [
          { x: x + node.width, y: y + node.height / 2 },
          { x: childX, y: childNodeY + child.height / 2 },
        ],
      });

      layoutNode(child, childX, childNodeY);

      childY += childHeight + VERTICAL_SPACING;
    }
  }

  layoutNode(tree, 50, 50);

  const padding = 50;
  return {
    nodes: nodeLayouts,
    edges,
    bounds: {
      minX: minX - padding,
      minY: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    },
  };
}
