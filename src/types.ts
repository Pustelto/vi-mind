export type NodeId = string;

export interface MindMapNode {
  id: NodeId;
  content: string;
  parentId: NodeId | null;
  order: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeLayout {
  nodeId: NodeId;
  position: Position;
  width: number;
  height: number;
}

export interface EdgeLayout {
  fromId: NodeId;
  toId: NodeId;
  points: Position[];
}

export interface LayoutResult {
  nodes: Map<NodeId, NodeLayout>;
  edges: EdgeLayout[];
  bounds: { minX: number; minY: number; width: number; height: number };
}

export type Mode = 'normal' | 'insert';

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export interface CommandDefinition {
  id: string;
  name: string;
  description: string;
  keybindings: string[];
  modes: Mode[];
  execute: (ctx: CommandContext) => void | Promise<void>;
  canExecute?: (ctx: CommandContext) => boolean;
}

export interface CommandContext {
  selectedNodeId: NodeId | null;
  selectedNodeContent: string | null;
  mode: Mode;
  hasNodes: boolean;
  isSelectedNodeRoot: boolean;
  selectNode: (id: NodeId) => void;
  createRootNode: () => void;
  createChildNode: (parentId: NodeId) => void;
  createSiblingAbove: (siblingId: NodeId) => void;
  createSiblingBelow: (siblingId: NodeId) => void;
  insertBetweenParentAndChild: (childId: NodeId) => void;
  updateNodeContent: (id: NodeId, content: string) => void | Promise<void>;
  deleteNode: (id: NodeId) => void;
  deleteNodeWithChildren: (id: NodeId) => void;
  deleteChildren: (id: NodeId) => void;
  enterInsertMode: () => void;
  exitInsertMode: () => void;
  navigateToParent: () => void;
  navigateToFirstChild: () => void;
  navigateToNextSibling: () => void;
  navigateToPreviousSibling: () => void;
  navigateToRoot: () => void;
  openSearch: () => void;
  openCommandPalette: () => void;
  fitToView: () => void;
  focusCurrentNode: () => void;
  copyNodeContent: () => void;
  panCanvas: (direction: 'up' | 'down' | 'left' | 'right') => void;
  zoomCanvas: (direction: 'in' | 'out') => void;
  exportAs: (format: 'svg' | 'png') => void;
}
