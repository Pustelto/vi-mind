import type { MindMapNode, NodeId, NodeLayout, EdgeLayout, LayoutResult } from '../types';

const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const HORIZONTAL_SPACING = 180;
const VERTICAL_SPACING = 60;

interface TreeNode {
  id: NodeId;
  content: string;
  children: TreeNode[];
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

  function buildNode(nodeId: NodeId): TreeNode | null {
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const children = childrenMap.get(nodeId) ?? [];
    return {
      id: node.id,
      content: node.content,
      children: children.map((c) => buildNode(c.id)).filter((n): n is TreeNode => n !== null),
    };
  }

  const root = rootId ? nodeMap.get(rootId) : nodes.find((n) => n.parentId === null);

  if (!root) return null;
  return buildNode(root.id);
}

function calculateSubtreeHeight(node: TreeNode): number {
  if (node.children.length === 0) {
    return NODE_HEIGHT;
  }
  const childrenHeight = node.children.reduce(
    (sum, child) => sum + calculateSubtreeHeight(child) + VERTICAL_SPACING,
    -VERTICAL_SPACING
  );
  return Math.max(NODE_HEIGHT, childrenHeight);
}

export function calculateLayout(nodes: MindMapNode[]): LayoutResult {
  const nodeLayouts = new Map<NodeId, NodeLayout>();
  const edges: EdgeLayout[] = [];

  if (nodes.length === 0) {
    return { nodes: nodeLayouts, edges, bounds: { width: 0, height: 0 } };
  }

  const tree = buildTree(nodes, null);
  if (!tree) {
    return { nodes: nodeLayouts, edges, bounds: { width: 0, height: 0 } };
  }

  let maxX = 0;
  let maxY = 0;

  function layoutNode(node: TreeNode, x: number, y: number): void {
    nodeLayouts.set(node.id, {
      nodeId: node.id,
      position: { x, y },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });

    maxX = Math.max(maxX, x + NODE_WIDTH);
    maxY = Math.max(maxY, y + NODE_HEIGHT);

    if (node.children.length === 0) return;

    const childrenHeights = node.children.map(calculateSubtreeHeight);
    const totalChildrenHeight = childrenHeights.reduce(
      (sum, h) => sum + h + VERTICAL_SPACING,
      -VERTICAL_SPACING
    );

    let childY = y + NODE_HEIGHT / 2 - totalChildrenHeight / 2;
    const childX = x + HORIZONTAL_SPACING;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childHeight = childrenHeights[i];

      const childNodeY = childY + childHeight / 2 - NODE_HEIGHT / 2;

      edges.push({
        fromId: node.id,
        toId: child.id,
        points: [
          { x: x + NODE_WIDTH, y: y + NODE_HEIGHT / 2 },
          { x: childX, y: childNodeY + NODE_HEIGHT / 2 },
        ],
      });

      layoutNode(child, childX, childNodeY);

      childY += childHeight + VERTICAL_SPACING;
    }
  }

  layoutNode(tree, 50, 50);

  return {
    nodes: nodeLayouts,
    edges,
    bounds: { width: maxX + 50, height: maxY + 50 },
  };
}
