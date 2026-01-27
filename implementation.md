# Mind Map Tool - Implementation Plan

## Executive Summary

A fast, VIM-like mind mapping tool built with React. Core value proposition: **keyboard-first navigation and editing** that feels native to VIM users.

**Design principles:**
- Simple, boring code that's easy to understand
- Functional programming patterns over OOP where practical
- Add complexity only when we feel pain, not in anticipation
- Separation of concerns: business logic decoupled from React

---

## Technical Decisions

### 1. Canvas: Custom SVG (Not React Flow)

**Decision**: Build custom SVG-based rendering.

**Rationale**:
- React Flow is mouse-centric; we're keyboard-first
- Lighter bundle, full control over keyboard handling
- Simpler for hierarchical trees vs general node graphs

### 2. Architecture: Pragmatic Layered Approach

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (React)                      │
│   Components, Hooks, React Context, State               │
├─────────────────────────────────────────────────────────┤
│                   Services Layer                         │
│   MindMapService, SearchService, ModeManager            │
├─────────────────────────────────────────────────────────┤
│                   Storage Layer                          │
│   Repository interface + implementations                 │
└─────────────────────────────────────────────────────────┘
```

**What we keep from DDD:**
- Repository pattern (async interface, ready for future storage backends)
- Dependency injection via function parameters and React Context
- Clean interfaces between layers
- Business logic decoupled from UI

**What we skip (for now):**
- Value Objects → plain types
- CQRS (Commands/Queries/Handlers) → simple service methods
- Domain Events + Event Bus → direct React state updates
- Custom DI Container → React Context + function composition

### 3. State Management: Zustand

**Decision**: Use Zustand with multiple focused stores (not one large context).

Two focused stores:
- `useNodeStore` - nodes array, selectedNodeId, CRUD operations
- `useUIStore` - mode, search/palette open, error state

This enables granular re-renders and easier testing.

### 4. Layout: Simple Hierarchical (O(n))

Pure function that takes nodes and returns positions. Easy to test, easy to swap later.

### 5. Storage: Async Repository (In-Memory for MVP)

Repository is async to support future storage backends (IndexedDB, backend API, etc.). MVP uses in-memory storage only - no persistence.

### 6. Error Handling: Result Pattern

Service methods return `Result<T, E>` instead of throwing:

```typescript
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Service method example
async deleteNode(nodeId: NodeId): Promise<Result<void, string>> {
  const node = await repository.findById(nodeId);
  if (!node) return { ok: false, error: 'Node not found' };
  if (node.parentId === null) return { ok: false, error: 'Cannot delete root node' };
  if (await hasChildren(nodeId)) return { ok: false, error: 'Node has children' };
  await repository.delete(nodeId);
  return { ok: true, value: undefined };
}
```

UI shows errors via toast/notification (optional for MVP, can just console.log).

### 7. Command System: Registry Pattern

Commands are first-class citizens with explicit registration:

```typescript
// Define command
const deleteNodeCommand: CommandDefinition = {
  id: 'node.delete',
  name: 'Delete Node',
  keybindings: ['dd'],
  modes: ['normal'],
  when: (ctx) => ctx.selectedNodeId !== null && !ctx.hasChildren(ctx.selectedNodeId),
  execute: (ctx) => ctx.deleteNode(ctx.selectedNodeId),
};

// Register in registry
commandRegistry.register(deleteNodeCommand);

// Later: execute by ID or keybinding
commandRegistry.execute('node.delete', context);
```

This makes adding new commands trivial - define object, register, done.

### 8. Testing: Vitest

Focus on testing services and input handling. UI components kept "dumb" for easy testing.

---

## Folder Structure

```
src/
├── types.ts                       # All TypeScript types in one file
│
├── services/
│   ├── mindMapService.ts          # Core business logic + navigation
│   └── searchService.ts           # Fuse.js wrapper
│
├── storage/
│   └── repository.ts              # Interface + InMemory implementation
│
├── layout/
│   └── hierarchicalLayout.ts      # Layout calculation (pure function)
│
├── input/
│   ├── modeManager.ts             # Normal/Insert mode state
│   ├── keyHandler.ts              # Key sequence handling
│   └── commands.ts                # All command definitions
│
├── ui/
│   ├── App.tsx
│   ├── MindMapCanvas.tsx
│   ├── MindMapNode.tsx
│   ├── MindMapEdge.tsx
│   ├── NodeEditor.tsx             # Inline text editing
│   ├── ModeIndicator.tsx
│   ├── SearchModal.tsx
│   ├── CommandPalette.tsx
│   └── hooks/
│       └── useKeyboardShortcuts.ts
│
├── stores/
│   ├── nodeStore.ts               # Nodes + selection state (Zustand)
│   ├── uiStore.ts                 # Mode + modals state (Zustand)
│   └── index.ts                   # Re-exports
│
├── styles/
│   └── index.css
│
└── main.tsx

tests/
├── services/
│   └── mindMapService.test.ts
├── input/
│   ├── modeManager.test.ts
│   └── keyHandler.test.ts
├── layout/
│   └── hierarchicalLayout.test.ts
├── storage/
│   └── repository.test.ts
├── stores/
│   ├── nodeStore.test.ts
│   └── uiStore.test.ts
└── integration/
    └── keyboardFlows.test.tsx     # Full user flow tests
```

---

## Core Types

```typescript
// src/types.ts

export type NodeId = string;

export interface MindMapNode {
  id: NodeId;
  content: string;
  parentId: NodeId | null;
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
  bounds: { width: number; height: number };
}

export type Mode = 'normal' | 'insert';

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface CommandDefinition {
  id: string;
  name: string;
  description: string;
  keybindings: string[];
  modes: Mode[];
  execute: (ctx: CommandContext) => void;
  canExecute?: (ctx: CommandContext) => boolean;
}

export interface CommandContext {
  selectedNodeId: NodeId | null;
  mode: Mode;
  // Actions provided by context
  selectNode: (id: NodeId) => void;
  createChildNode: (parentId: NodeId) => void;
  createSiblingNode: (siblingId: NodeId) => void;
  updateNodeContent: (id: NodeId, content: string) => void;
  deleteNode: (id: NodeId) => void;
  deleteNodeWithChildren: (id: NodeId) => void;
  enterInsertMode: () => void;
  exitInsertMode: () => void;
  navigateToParent: () => void;
  navigateToFirstChild: () => void;
  navigateToNextSibling: () => void;
  navigateToPreviousSibling: () => void;
  openSearch: () => void;
  openCommandPalette: () => void;
}
```

---

## Implementation Tasks

Tasks ordered by dependency. Each designed to be completable in 1-3 hours.

---

### Phase 0: Project Setup (1 hour)

#### Task 0.1: Initialize Project
**Files**: `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`

**Implementation**:
1. Initialize Vite + React + TypeScript project
2. Configure Tailwind CSS
3. Configure Vitest for testing
4. Set up test utilities

```bash
npm create vite@latest . -- --template react-ts
npm install -D tailwindcss postcss autoprefixer
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install fuse.js zustand
npx tailwindcss init -p
```

**Vitest config** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**Test setup** (`src/test/setup.ts`):
```typescript
import '@testing-library/jest-dom';
```

**Tailwind config** (`tailwind.config.js`):
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

**Verification**: `npm run dev` works, `npm test` runs

---

### Phase 1: Core Foundation (3-4 hours)

#### Task 1.1: Types and Repository Interface
**Files**: `src/types.ts`, `src/storage/repository.ts`

**Implementation**:
```typescript
// src/storage/repository.ts
import { MindMapNode, NodeId } from '../types';

// Async interface - ready for IndexedDB, backend API, etc.
export interface Repository {
  save(node: MindMapNode): Promise<void>;
  findById(id: NodeId): Promise<MindMapNode | null>;
  findByParentId(parentId: NodeId | null): Promise<MindMapNode[]>;
  findAll(): Promise<MindMapNode[]>;
  delete(id: NodeId): Promise<void>;
  clear(): Promise<void>;
}

// In-memory implementation (MVP - no persistence)
export function createInMemoryRepository(): Repository {
  const nodes = new Map<NodeId, MindMapNode>();

  return {
    save: async (node) => { nodes.set(node.id, node); },
    findById: async (id) => nodes.get(id) ?? null,
    findByParentId: async (parentId) =>
      Array.from(nodes.values()).filter(n => n.parentId === parentId),
    findAll: async () => Array.from(nodes.values()),
    delete: async (id) => { nodes.delete(id); },
    clear: async () => { nodes.clear(); },
  };
}
```

**Tests**:
- Save and retrieve node
- Find by parent ID
- Find all nodes
- Delete node

**Verification**: `npm test -- storage/repository`

---

#### Task 1.2: Mind Map Service
**Files**: `src/services/mindMapService.ts`

**Implementation**:
```typescript
import { MindMapNode, NodeId } from '../types';
import { Repository } from '../storage/repository';

export interface MindMapService {
  // Queries
  getAllNodes(): Promise<MindMapNode[]>;
  getNode(id: NodeId): Promise<MindMapNode | null>;
  getChildren(parentId: NodeId): Promise<MindMapNode[]>;
  getParent(nodeId: NodeId): Promise<MindMapNode | null>;
  getSiblings(nodeId: NodeId): Promise<MindMapNode[]>;
  hasChildren(nodeId: NodeId): Promise<boolean>;

  // Navigation (returns target node ID or null)
  getParentId(nodeId: NodeId): Promise<NodeId | null>;
  getFirstChildId(nodeId: NodeId): Promise<NodeId | null>;
  getNextSiblingId(nodeId: NodeId): Promise<NodeId | null>;
  getPreviousSiblingId(nodeId: NodeId): Promise<NodeId | null>;

  // Commands
  createNode(content: string, parentId: NodeId | null): Promise<MindMapNode>;
  updateContent(nodeId: NodeId, content: string): Promise<MindMapNode>;
  deleteNode(nodeId: NodeId): Promise<Result<void, string>>;
  deleteNodeWithChildren(nodeId: NodeId): Promise<void>;

  // Initialization
  ensureRootExists(): Promise<MindMapNode>;
}

export function createMindMapService(repository: Repository): MindMapService {
  const generateId = (): NodeId => crypto.randomUUID();

  const getAllNodes = () => repository.findAll();

  const getNode = (id: NodeId) => repository.findById(id);

  const getChildren = (parentId: NodeId) => repository.findByParentId(parentId);

  const getParent = async (nodeId: NodeId): Promise<MindMapNode | null> => {
    const node = await repository.findById(nodeId);
    if (!node?.parentId) return null;
    return repository.findById(node.parentId);
  };

  const getSiblings = async (nodeId: NodeId): Promise<MindMapNode[]> => {
    const node = await repository.findById(nodeId);
    if (!node) return [];
    const siblings = await repository.findByParentId(node.parentId);
    return siblings.filter(n => n.id !== nodeId);
  };

  const hasChildren = async (nodeId: NodeId): Promise<boolean> => {
    const children = await repository.findByParentId(nodeId);
    return children.length > 0;
  };

  const createNode = async (content: string, parentId: NodeId | null): Promise<MindMapNode> => {
    const node: MindMapNode = { id: generateId(), content, parentId };
    await repository.save(node);
    return node;
  };

  const updateContent = async (nodeId: NodeId, content: string): Promise<MindMapNode> => {
    const node = await repository.findById(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    const updated = { ...node, content };
    await repository.save(updated);
    return updated;
  };

  const deleteNode = async (nodeId: NodeId): Promise<Result<void, string>> => {
    const node = await repository.findById(nodeId);
    if (!node) return { ok: false, error: 'Node not found' };
    if (node.parentId === null) return { ok: false, error: 'Cannot delete root node' };
    if (await hasChildren(nodeId)) return { ok: false, error: 'Node has children' };
    await repository.delete(nodeId);
    return { ok: true, value: undefined };
  };

  const deleteNodeWithChildren = async (nodeId: NodeId): Promise<void> => {
    const children = await getChildren(nodeId);
    for (const child of children) {
      await deleteNodeWithChildren(child.id);
    }
    await repository.delete(nodeId);
  };

  const ensureRootExists = async (): Promise<MindMapNode> => {
    const all = await getAllNodes();
    const root = all.find(n => n.parentId === null);
    if (root) return root;
    return createNode('Root', null);
  };

  // Navigation methods
  const getParentId = async (nodeId: NodeId): Promise<NodeId | null> => {
    const parent = await getParent(nodeId);
    return parent?.id ?? null;
  };

  const getFirstChildId = async (nodeId: NodeId): Promise<NodeId | null> => {
    const children = await getChildren(nodeId);
    return children[0]?.id ?? null;
  };

  const getSiblingsWithSelf = async (nodeId: NodeId): Promise<{ ids: NodeId[]; index: number }> => {
    const node = await getNode(nodeId);
    if (!node) return { ids: [], index: -1 };
    const siblings = node.parentId === null
      ? (await getAllNodes()).filter(n => n.parentId === null)
      : await getChildren(node.parentId);
    const index = siblings.findIndex(n => n.id === nodeId);
    return { ids: siblings.map(n => n.id), index };
  };

  const getNextSiblingId = async (nodeId: NodeId): Promise<NodeId | null> => {
    const { ids, index } = await getSiblingsWithSelf(nodeId);
    if (index === -1 || index >= ids.length - 1) return null;
    return ids[index + 1];
  };

  const getPreviousSiblingId = async (nodeId: NodeId): Promise<NodeId | null> => {
    const { ids, index } = await getSiblingsWithSelf(nodeId);
    if (index <= 0) return null;
    return ids[index - 1];
  };

  return {
    getAllNodes,
    getNode,
    getChildren,
    getParent,
    getSiblings,
    hasChildren,
    getParentId,
    getFirstChildId,
    getNextSiblingId,
    getPreviousSiblingId,
    createNode,
    updateContent,
    deleteNode,
    deleteNodeWithChildren,
    ensureRootExists,
  };
}
```

**Tests**:
- Create node
- Create child node (with parentId)
- Update content
- Delete leaf node succeeds
- Delete root node returns error
- Delete node with children returns error
- deleteNodeWithChildren removes all descendants
- ensureRootExists creates root if missing
- Navigation: getParentId returns null for root
- Navigation: getFirstChildId returns null if no children
- Navigation: getNextSiblingId returns null at end
- Navigation: getPreviousSiblingId returns null at start

**Verification**: `npm test -- services/mindMapService`

---

### Phase 2: Input Handling (4-6 hours)

#### Task 2.1: Mode Manager
**Files**: `src/input/modeManager.ts`

**Implementation**:
```typescript
import { Mode } from '../types';

export interface ModeManager {
  getMode(): Mode;
  isNormalMode(): boolean;
  isInsertMode(): boolean;
  enterInsertMode(): void;
  exitInsertMode(): void;
  onModeChange(handler: (mode: Mode) => void): () => void;
}

export function createModeManager(): ModeManager {
  let currentMode: Mode = 'normal';
  const listeners = new Set<(mode: Mode) => void>();

  const notify = () => {
    listeners.forEach(fn => fn(currentMode));
  };

  return {
    getMode: () => currentMode,
    isNormalMode: () => currentMode === 'normal',
    isInsertMode: () => currentMode === 'insert',
    enterInsertMode: () => {
      if (currentMode !== 'insert') {
        currentMode = 'insert';
        notify();
      }
    },
    exitInsertMode: () => {
      if (currentMode !== 'normal') {
        currentMode = 'normal';
        notify();
      }
    },
    onModeChange: (handler) => {
      listeners.add(handler);
      return () => { listeners.delete(handler); };
    },
  };
}
```

**Tests**:
- Initial mode is normal
- Enter insert mode
- Exit insert mode
- Mode change listeners fire
- Unsubscribe works

**Verification**: `npm test -- input/modeManager`

---

#### Task 2.2: Key Handler
**Files**: `src/input/keyHandler.ts`

**Implementation**:
```typescript
import { Mode, CommandDefinition, CommandContext } from '../types';

export interface KeyHandler {
  handleKeyDown(event: KeyboardEvent, context: CommandContext): boolean;
  getCommands(): CommandDefinition[];
  getCommandsByMode(mode: Mode): CommandDefinition[];
}

export function createKeyHandler(commands: CommandDefinition[]): KeyHandler {
  let keyBuffer = '';
  let timeoutId: number | null = null;
  const TIMEOUT_MS = 1000;

  const resetBuffer = () => {
    keyBuffer = '';
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const findExactMatch = (keys: string, mode: Mode): CommandDefinition | null => {
    return commands.find(
      cmd => cmd.keybindings.includes(keys) && cmd.modes.includes(mode)
    ) ?? null;
  };

  const findPrefixMatches = (keys: string, mode: Mode): CommandDefinition[] => {
    return commands.filter(
      cmd => cmd.modes.includes(mode) &&
             cmd.keybindings.some(kb => kb.startsWith(keys) && kb !== keys)
    );
  };

  const handleKeyDown = (event: KeyboardEvent, context: CommandContext): boolean => {
    const key = event.key;

    // Always handle Escape, even in inputs (for exiting insert mode)
    if (key === 'Escape') {
      const escCmd = findExactMatch('Escape', context.mode);
      if (escCmd && (!escCmd.canExecute || escCmd.canExecute(context))) {
        escCmd.execute(context);
        resetBuffer();
        return true;
      }
    }

    // Skip if in input and not Escape
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement) {
      return false;
    }

    // Handle Cmd+K for command palette
    if ((event.metaKey || event.ctrlKey) && key === 'k') {
      context.openCommandPalette();
      return true;
    }

    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Build key sequence
    keyBuffer += key;

    // Check for exact match
    const exactMatch = findExactMatch(keyBuffer, context.mode);
    if (exactMatch && (!exactMatch.canExecute || exactMatch.canExecute(context))) {
      exactMatch.execute(context);
      resetBuffer();
      return true;
    }

    // Check for prefix matches (waiting for more keys)
    const prefixMatches = findPrefixMatches(keyBuffer, context.mode);
    if (prefixMatches.length > 0) {
      // Set timeout to reset if no more keys
      timeoutId = window.setTimeout(resetBuffer, TIMEOUT_MS);
      return true; // Handled, waiting for more
    }

    // No match - reset and ignore
    resetBuffer();
    return false;
  };

  return {
    handleKeyDown,
    getCommands: () => [...commands],
    getCommandsByMode: (mode) => commands.filter(cmd => cmd.modes.includes(mode)),
  };
}
```

**Tests**:
- Single key command executes immediately
- Multi-key command (dd) executes on second key
- Prefix key (d) waits for more input
- Timeout resets buffer
- Escape works even in inputs
- Cmd+K opens command palette
- Unknown keys reset buffer

**Verification**: `npm test -- input/keyHandler`

---

#### Task 2.3: Command Definitions
**Files**: `src/input/commands.ts`

**Implementation**:
```typescript
import { CommandDefinition, CommandContext } from '../types';

export function createCommands(): CommandDefinition[] {
  return [
    // Navigation
    {
      id: 'nav.parent',
      name: 'Go to Parent',
      description: 'Move focus to parent node',
      keybindings: ['h', 'ArrowLeft'],
      modes: ['normal'],
      execute: (ctx) => ctx.navigateToParent(),
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },
    {
      id: 'nav.child',
      name: 'Go to First Child',
      description: 'Move focus to first child node',
      keybindings: ['l', 'ArrowRight'],
      modes: ['normal'],
      execute: (ctx) => ctx.navigateToFirstChild(),
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },
    {
      id: 'nav.nextSibling',
      name: 'Go to Next Sibling',
      description: 'Move focus to next sibling node',
      keybindings: ['j', 'ArrowDown'],
      modes: ['normal'],
      execute: (ctx) => ctx.navigateToNextSibling(),
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },
    {
      id: 'nav.prevSibling',
      name: 'Go to Previous Sibling',
      description: 'Move focus to previous sibling node',
      keybindings: ['k', 'ArrowUp'],
      modes: ['normal'],
      execute: (ctx) => ctx.navigateToPreviousSibling(),
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },

    // Editing
    {
      id: 'edit.createChild',
      name: 'Create Child Node',
      description: 'Create a new child node and enter insert mode',
      keybindings: ['a'],
      modes: ['normal'],
      execute: (ctx) => {
        if (ctx.selectedNodeId) {
          ctx.createChildNode(ctx.selectedNodeId);
        }
      },
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },
    {
      id: 'edit.createSibling',
      name: 'Create Sibling Node',
      description: 'Create a new sibling node and enter insert mode',
      keybindings: ['o'],
      modes: ['normal'],
      execute: (ctx) => {
        if (ctx.selectedNodeId) {
          ctx.createSiblingNode(ctx.selectedNodeId);
        }
      },
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },
    {
      id: 'edit.delete',
      name: 'Delete Node',
      description: 'Delete the selected node (must have no children)',
      keybindings: ['dd'],
      modes: ['normal'],
      execute: (ctx) => {
        if (ctx.selectedNodeId) {
          ctx.deleteNode(ctx.selectedNodeId);
        }
      },
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },
    {
      id: 'edit.deleteWithChildren',
      name: 'Delete Node with Children',
      description: 'Delete the selected node and all its children',
      keybindings: ['gd'],
      modes: ['normal'],
      execute: (ctx) => {
        if (ctx.selectedNodeId) {
          ctx.deleteNodeWithChildren(ctx.selectedNodeId);
        }
      },
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },
    {
      id: 'edit.enterInsert',
      name: 'Enter Insert Mode',
      description: 'Edit the selected node content',
      keybindings: ['i'],
      modes: ['normal'],
      execute: (ctx) => ctx.enterInsertMode(),
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },
    {
      id: 'edit.changeNode',
      name: 'Change Node Content',
      description: 'Clear node content and enter insert mode',
      keybindings: ['cin'],
      modes: ['normal'],
      execute: (ctx) => {
        if (ctx.selectedNodeId) {
          ctx.updateNodeContent(ctx.selectedNodeId, '');
          ctx.enterInsertMode();
        }
      },
      canExecute: (ctx) => ctx.selectedNodeId !== null,
    },

    // Mode
    {
      id: 'mode.exitInsert',
      name: 'Exit Insert Mode',
      description: 'Return to normal mode',
      keybindings: ['Escape'],
      modes: ['insert'],
      execute: (ctx) => ctx.exitInsertMode(),
    },

    // Search
    {
      id: 'search.open',
      name: 'Search Nodes',
      description: 'Open search to find nodes by content',
      keybindings: ['/'],
      modes: ['normal'],
      execute: (ctx) => ctx.openSearch(),
    },
  ];
}
```

**Tests**:
- All commands have required fields
- Keybindings are unique within modes
- canExecute prevents execution when invalid

**Verification**: `npm test -- input/commands`

---

### Phase 3: Layout (2-3 hours)

#### Task 3.1: Hierarchical Layout
**Files**: `src/layout/hierarchicalLayout.ts`

**Implementation**:
```typescript
import { MindMapNode, NodeId, NodeLayout, EdgeLayout, LayoutResult, Position } from '../types';

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
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
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
      children: children.map(c => buildNode(c.id)).filter((n): n is TreeNode => n !== null),
    };
  }

  // Find root node
  const root = rootId
    ? nodeMap.get(rootId)
    : nodes.find(n => n.parentId === null);

  if (!root) return null;
  return buildNode(root.id);
}

function calculateSubtreeHeight(node: TreeNode): number {
  if (node.children.length === 0) {
    return NODE_HEIGHT;
  }
  const childrenHeight = node.children.reduce(
    (sum, child) => sum + calculateSubtreeHeight(child) + VERTICAL_SPACING,
    -VERTICAL_SPACING // Remove extra spacing after last child
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
    // Position this node
    nodeLayouts.set(node.id, {
      nodeId: node.id,
      position: { x, y },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });

    maxX = Math.max(maxX, x + NODE_WIDTH);
    maxY = Math.max(maxY, y + NODE_HEIGHT);

    if (node.children.length === 0) return;

    // Calculate total height needed for children
    const childrenHeights = node.children.map(calculateSubtreeHeight);
    const totalChildrenHeight = childrenHeights.reduce(
      (sum, h) => sum + h + VERTICAL_SPACING,
      -VERTICAL_SPACING
    );

    // Start children centered vertically relative to parent
    let childY = y + NODE_HEIGHT / 2 - totalChildrenHeight / 2;
    const childX = x + HORIZONTAL_SPACING;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childHeight = childrenHeights[i];

      // Center child in its allocated space
      const childNodeY = childY + childHeight / 2 - NODE_HEIGHT / 2;

      // Create edge
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

  // Start layout from top-left with padding
  layoutNode(tree, 50, 50);

  return {
    nodes: nodeLayouts,
    edges,
    bounds: { width: maxX + 50, height: maxY + 50 },
  };
}
```

**Tests**:
- Single node positioned at origin
- Parent with one child
- Parent with multiple children (distributed vertically)
- Deep tree (no overlapping)
- Edges connect parent to children
- Bounds calculated correctly
- Empty nodes array returns empty result

**Verification**: `npm test -- layout/hierarchicalLayout`

---

### Phase 4: Search (1-2 hours)

#### Task 4.1: Search Service
**Files**: `src/services/searchService.ts`

**Implementation**:
```typescript
import Fuse from 'fuse.js';
import { MindMapNode, NodeId } from '../types';

export interface SearchResult {
  nodeId: NodeId;
  content: string;
  score: number;
  matches: Array<{ indices: [number, number][] }>;
}

export interface SearchService {
  search(query: string): SearchResult[];
  updateNodes(nodes: MindMapNode[]): void;
}

export function createSearchService(initialNodes: MindMapNode[] = []): SearchService {
  let fuse = new Fuse(initialNodes, {
    keys: ['content'],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    includeMatches: true,
  });

  return {
    search: (query: string): SearchResult[] => {
      if (!query.trim()) return [];

      return fuse.search(query).map(result => ({
        nodeId: result.item.id,
        content: result.item.content,
        score: result.score ?? 0,
        matches: result.matches?.map(m => ({ indices: m.indices as [number, number][] })) ?? [],
      }));
    },

    updateNodes: (nodes: MindMapNode[]): void => {
      fuse = new Fuse(nodes, {
        keys: ['content'],
        threshold: 0.4,
        distance: 100,
        includeScore: true,
        includeMatches: true,
      });
    },
  };
}
```

**Tests**:
- Exact match returns result
- Fuzzy match returns result
- Results sorted by score
- Match indices provided
- Empty query returns empty
- updateNodes refreshes index

**Verification**: `npm test -- services/searchService`

---

### Phase 5: React UI (8-12 hours)

#### Task 5.1: Zustand Stores
**Files**: `src/stores/nodeStore.ts`, `src/stores/uiStore.ts`, `src/stores/index.ts`

Three focused stores for granular re-renders:

**Node Store** (`src/stores/nodeStore.ts`):
```typescript
import { create } from 'zustand';
import { MindMapNode, NodeId } from '../types';
import { MindMapService } from '../services/mindMapService';

interface NodeState {
  nodes: MindMapNode[];
  selectedNodeId: NodeId | null;
  service: MindMapService | null;

  // Actions
  initialize: (service: MindMapService) => Promise<void>;
  selectNode: (id: NodeId) => void;
  refreshNodes: () => Promise<void>;
  createChildNode: (parentId: NodeId) => Promise<MindMapNode>;
  createSiblingNode: (siblingId: NodeId) => Promise<MindMapNode | null>;
  updateNodeContent: (id: NodeId, content: string) => Promise<void>;
  deleteNode: (id: NodeId) => Promise<{ ok: boolean; error?: string }>;
  deleteNodeWithChildren: (id: NodeId) => Promise<void>;
}

export const useNodeStore = create<NodeState>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  service: null,

  initialize: async (service) => {
    const root = await service.ensureRootExists();
    const nodes = await service.getAllNodes();
    set({ service, nodes, selectedNodeId: root.id });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  refreshNodes: async () => {
    const { service } = get();
    if (!service) return;
    const nodes = await service.getAllNodes();
    set({ nodes });
  },

  createChildNode: async (parentId) => {
    const { service, refreshNodes } = get();
    if (!service) throw new Error('Service not initialized');
    const node = await service.createNode('New Node', parentId);
    await refreshNodes();
    set({ selectedNodeId: node.id });
    return node;
  },

  createSiblingNode: async (siblingId) => {
    const { service, refreshNodes } = get();
    if (!service) return null;
    const sibling = await service.getNode(siblingId);
    if (!sibling) return null;
    const node = await service.createNode('New Node', sibling.parentId);
    await refreshNodes();
    set({ selectedNodeId: node.id });
    return node;
  },

  updateNodeContent: async (id, content) => {
    const { service, refreshNodes } = get();
    if (!service) return;
    await service.updateContent(id, content);
    await refreshNodes();
  },

  deleteNode: async (id) => {
    const { service, refreshNodes } = get();
    if (!service) return { ok: false, error: 'Service not initialized' };
    const parent = await service.getParent(id);
    const siblings = await service.getSiblings(id);
    const result = await service.deleteNode(id);
    if (!result.ok) return result;
    await refreshNodes();
    set({ selectedNodeId: siblings[0]?.id ?? parent?.id ?? null });
    return { ok: true };
  },

  deleteNodeWithChildren: async (id) => {
    const { service, refreshNodes } = get();
    if (!service) return;
    const parent = await service.getParent(id);
    const siblings = await service.getSiblings(id);
    await service.deleteNodeWithChildren(id);
    await refreshNodes();
    set({ selectedNodeId: siblings[0]?.id ?? parent?.id ?? null });
  },
}));
```

**UI Store** (`src/stores/uiStore.ts`):
```typescript
import { create } from 'zustand';
import { Mode } from '../types';

interface UIState {
  mode: Mode;
  isSearchOpen: boolean;
  isCommandPaletteOpen: boolean;
  error: string | null;

  // Actions
  setMode: (mode: Mode) => void;
  enterInsertMode: () => void;
  exitInsertMode: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setError: (error: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: 'normal',
  isSearchOpen: false,
  isCommandPaletteOpen: false,
  error: null,

  setMode: (mode) => set({ mode }),
  enterInsertMode: () => set({ mode: 'insert' }),
  exitInsertMode: () => set({ mode: 'normal' }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  setError: (error) => set({ error }),
}));
```

**Store index** (`src/stores/index.ts`):
```typescript
export { useNodeStore } from './nodeStore';
export { useUIStore } from './uiStore';
```

**Tests**:
- Node store initializes with root node
- Node store CRUD operations work
- UI store mode toggles work
- UI store modal states work

**Verification**: `npm test -- stores/`

---

#### Task 5.2: Keyboard Shortcuts Hook
**Files**: `src/ui/hooks/useKeyboardShortcuts.ts`

**Implementation**:
```typescript
import { useEffect, useMemo } from 'react';
import { useNodeStore, useUIStore } from '../../stores';
import { createKeyHandler } from '../../input/keyHandler';
import { createCommands } from '../../input/commands';
import { CommandContext } from '../../types';

export function useKeyboardShortcuts() {
  const nodeStore = useNodeStore();
  const uiStore = useUIStore();

  const keyHandler = useMemo(() => {
    const commands = createCommands();
    return createKeyHandler(commands);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Build command context from stores
      const ctx: CommandContext = {
        selectedNodeId: nodeStore.selectedNodeId,
        mode: uiStore.mode,
        selectNode: nodeStore.selectNode,
        createChildNode: (parentId) => {
          nodeStore.createChildNode(parentId);
          uiStore.enterInsertMode();
        },
        createSiblingNode: (siblingId) => {
          nodeStore.createSiblingNode(siblingId);
          uiStore.enterInsertMode();
        },
        updateNodeContent: nodeStore.updateNodeContent,
        deleteNode: async (id) => {
          const result = await nodeStore.deleteNode(id);
          if (!result.ok && result.error) {
            uiStore.setError(result.error);
          }
        },
        deleteNodeWithChildren: nodeStore.deleteNodeWithChildren,
        enterInsertMode: uiStore.enterInsertMode,
        exitInsertMode: uiStore.exitInsertMode,
        navigateToParent: async () => {
          const { service, selectedNodeId } = useNodeStore.getState();
          if (!service || !selectedNodeId) return;
          const parentId = await service.getParentId(selectedNodeId);
          if (parentId) nodeStore.selectNode(parentId);
        },
        navigateToFirstChild: async () => {
          const { service, selectedNodeId } = useNodeStore.getState();
          if (!service || !selectedNodeId) return;
          const childId = await service.getFirstChildId(selectedNodeId);
          if (childId) nodeStore.selectNode(childId);
        },
        navigateToNextSibling: async () => {
          const { service, selectedNodeId } = useNodeStore.getState();
          if (!service || !selectedNodeId) return;
          const siblingId = await service.getNextSiblingId(selectedNodeId);
          if (siblingId) nodeStore.selectNode(siblingId);
        },
        navigateToPreviousSibling: async () => {
          const { service, selectedNodeId } = useNodeStore.getState();
          if (!service || !selectedNodeId) return;
          const siblingId = await service.getPreviousSiblingId(selectedNodeId);
          if (siblingId) nodeStore.selectNode(siblingId);
        },
        openSearch: uiStore.openSearch,
        openCommandPalette: uiStore.openCommandPalette,
      };

      const handled = keyHandler.handleKeyDown(event, ctx);
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyHandler, nodeStore, uiStore]);

  return keyHandler;
}
```

**Tests**:
- Hook integrates with context
- Commands execute correctly

**Verification**: `npm test -- ui/hooks/useKeyboardShortcuts`

---

#### Task 5.3: Mind Map Canvas
**Files**: `src/ui/MindMapCanvas.tsx`

**Implementation**:
```typescript
import { useMemo } from 'react';
import { useNodeStore } from '../stores';
import { calculateLayout } from '../layout/hierarchicalLayout';
import { MindMapNodeComponent } from './MindMapNode';
import { MindMapEdge } from './MindMapEdge';

export function MindMapCanvas() {
  const nodes = useNodeStore((state) => state.nodes);
  const selectedNodeId = useNodeStore((state) => state.selectedNodeId);

  const layout = useMemo(() => calculateLayout(nodes), [nodes]);

  return (
    <svg
      className="w-full h-full bg-gray-50"
      viewBox={`0 0 ${layout.bounds.width} ${layout.bounds.height}`}
    >
      <g className="edges">
        {layout.edges.map(edge => (
          <MindMapEdge key={`${edge.fromId}-${edge.toId}`} edge={edge} />
        ))}
      </g>
      <g className="nodes">
        {Array.from(layout.nodes.entries()).map(([nodeId, nodeLayout]) => {
          const node = nodes.find(n => n.id === nodeId);
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
```

**Tests**:
- Renders nodes from context
- Renders edges between nodes
- Selected node has different style

**Verification**: `npm test -- ui/MindMapCanvas`

---

#### Task 5.4: Mind Map Node (Dumb Component)
**Files**: `src/ui/MindMapNode.tsx`

**Implementation**:
```typescript
import { MindMapNode, NodeLayout } from '../types';
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
        className={`
          fill-white stroke-2 transition-colors
          ${isSelected
            ? 'stroke-blue-500 fill-blue-50'
            : 'stroke-gray-300 hover:stroke-gray-400'
          }
        `}
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
        >
          {node.content}
        </text>
      )}
    </g>
  );
}
```

**Tests**:
- Renders content
- Shows selection state
- Enters edit mode when selected and insert mode
- Calls handlers on interaction

**Verification**: `npm test -- ui/MindMapNode`

---

#### Task 5.5: Node Editor
**Files**: `src/ui/NodeEditor.tsx`

**Implementation**:
```typescript
import { useRef, useEffect, useState } from 'react';

interface Props {
  content: string;
  width: number;
  height: number;
  onChange: (content: string) => void;
  onComplete: () => void;
}

export function NodeEditor({ content, width, height, onChange, onComplete }: Props) {
  const [value, setValue] = useState(content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onChange(value);
      onComplete();
      e.stopPropagation();
    } else if (e.key === 'Enter') {
      onChange(value);
      onComplete();
      e.stopPropagation();
    }
  };

  const handleBlur = () => {
    onChange(value);
    onComplete();
  };

  return (
    <foreignObject x={4} y={4} width={width - 8} height={height - 8}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full h-full px-2 text-sm border-none outline-none bg-transparent"
      />
    </foreignObject>
  );
}
```

**Tests**:
- Auto-focuses on mount
- Escape saves and exits
- Enter saves and exits
- Blur saves and exits

**Verification**: `npm test -- ui/NodeEditor`

---

#### Task 5.6: Mind Map Edge
**Files**: `src/ui/MindMapEdge.tsx`

**Implementation**:
```typescript
import { EdgeLayout } from '../types';

interface Props {
  edge: EdgeLayout;
}

export function MindMapEdge({ edge }: Props) {
  const [start, end] = edge.points;

  // Create smooth bezier curve
  const midX = (start.x + end.x) / 2;
  const d = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

  return (
    <path
      d={d}
      fill="none"
      className="stroke-gray-300 stroke-2"
    />
  );
}
```

**Tests**:
- Renders valid SVG path

**Verification**: `npm test -- ui/MindMapEdge`

---

#### Task 5.7: Mode Indicator
**Files**: `src/ui/ModeIndicator.tsx`

**Implementation**:
```typescript
import { useUIStore } from '../stores';

export function ModeIndicator() {
  const mode = useUIStore((state) => state.mode);

  return (
    <div className={`
      fixed bottom-4 left-4 px-3 py-1 rounded font-mono text-sm
      ${mode === 'normal'
        ? 'bg-gray-800 text-white'
        : 'bg-green-600 text-white'
      }
    `}>
      -- {mode.toUpperCase()} --
    </div>
  );
}
```

**Tests**:
- Shows NORMAL mode
- Shows INSERT mode with different style

**Verification**: `npm test -- ui/ModeIndicator`

---

#### Task 5.8: Search Modal
**Files**: `src/ui/SearchModal.tsx`

**Implementation**:
```typescript
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNodeStore, useUIStore } from '../stores';
import { createSearchService } from '../services/searchService';

export function SearchModal() {
  const nodes = useNodeStore((state) => state.nodes);
  const selectNode = useNodeStore((state) => state.selectNode);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const closeSearch = useUIStore((state) => state.closeSearch);

  const searchService = useMemo(() => createSearchService(nodes), [nodes]);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query ? searchService.search(query) : [];

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'n':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
      case 'N':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          selectNode(results[selectedIndex].nodeId);
          handleClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  const handleClose = () => {
    setQuery('');
    closeSearch();
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b">
          <span className="text-gray-400 mr-2">/</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes..."
            className="flex-1 outline-none"
          />
        </div>
        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto">
            {results.map((result, i) => (
              <div
                key={result.nodeId}
                className={`
                  px-4 py-2 cursor-pointer
                  ${i === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}
                `}
                onClick={() => {
                  selectNode(result.nodeId);
                  handleClose();
                }}
              >
                {result.content}
              </div>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            No nodes found
          </div>
        )}
      </div>
    </div>
  );
}
```

**Tests**:
- Opens/closes correctly
- Filters results
- Keyboard navigation works
- Enter selects result
- Escape closes

**Verification**: `npm test -- ui/SearchModal`

---

#### Task 5.9: Command Palette
**Files**: `src/ui/CommandPalette.tsx`

**Implementation**:
```typescript
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNodeStore, useUIStore } from '../stores';
import { createCommands } from '../input/commands';
import { CommandContext } from '../types';

export function CommandPalette() {
  const nodeStore = useNodeStore();
  const uiStore = useUIStore();
  const { isCommandPaletteOpen, closeCommandPalette } = uiStore;

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands = useMemo(() => createCommands(), []);

  const availableCommands = useMemo(() => {
    return allCommands
      .filter(cmd => cmd.modes.includes(ctx.mode))
      .filter(cmd => !cmd.canExecute || cmd.canExecute(ctx))
      .filter(cmd =>
        !query ||
        cmd.name.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
      );
  }, [allCommands, ctx, query]);

  useEffect(() => {
    if (isCommandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [availableCommands.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, availableCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const cmd = availableCommands[selectedIndex];
        if (cmd) {
          cmd.execute(ctx);
          handleClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  const handleClose = () => {
    setQuery('');
    closeCommandPalette();
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="w-full outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {availableCommands.map((cmd, i) => (
            <div
              key={cmd.id}
              className={`
                px-4 py-2 cursor-pointer flex justify-between items-center
                ${i === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}
              `}
              onClick={() => {
                cmd.execute(ctx);
                handleClose();
              }}
            >
              <div>
                <div className="font-medium">{cmd.name}</div>
                <div className="text-sm text-gray-500">{cmd.description}</div>
              </div>
              <div className="text-sm text-gray-400 font-mono">
                {cmd.keybindings[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Tests**:
- Opens/closes correctly
- Shows available commands
- Filters by query
- Executes on Enter

**Verification**: `npm test -- ui/CommandPalette`

---

#### Task 5.10: App Component
**Files**: `src/ui/App.tsx`

**Implementation**:
```typescript
import { useEffect } from 'react';
import { useNodeStore, useUIStore } from '../stores';
import { createInMemoryRepository } from '../storage/repository';
import { createMindMapService } from '../services/mindMapService';
import { MindMapCanvas } from './MindMapCanvas';
import { ModeIndicator } from './ModeIndicator';
import { SearchModal } from './SearchModal';
import { CommandPalette } from './CommandPalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export function App() {
  const initialize = useNodeStore((state) => state.initialize);
  const error = useUIStore((state) => state.error);
  const setError = useUIStore((state) => state.setError);

  useEffect(() => {
    const repository = createInMemoryRepository();
    const service = createMindMapService(repository);
    initialize(service);
  }, [initialize]);

  useKeyboardShortcuts();

  return (
    <div className="w-screen h-screen overflow-hidden">
      <MindMapCanvas />
      <ModeIndicator />
      <SearchModal />
      <CommandPalette />
      {error && (
        <div
          className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded"
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}
    </div>
  );
}
```

**Tests**:
- Renders without crashing
- Keyboard shortcuts work

**Verification**: `npm test -- ui/App`

---

### Phase 6: Polish (3-5 hours)

#### Task 6.1: Styles
**Files**: `src/styles/index.css`

**Implementation**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles for mind map */
.mind-map-canvas {
  @apply bg-gray-50;
}

/* Ensure SVG elements are interactive */
svg text {
  user-select: none;
}

/* Focus visible styles */
.node-focused {
  @apply ring-2 ring-blue-500 ring-offset-2;
}
```

**Verification**: Visual inspection

---

#### Task 6.2: Zoom and Pan (Basic)
**Files**: Update `src/ui/MindMapCanvas.tsx`

**Implementation**:
Add basic zoom with scroll wheel and pan with drag:

```typescript
const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });

const handleWheel = (e: React.WheelEvent) => {
  e.preventDefault();
  const scale = e.deltaY > 0 ? 1.1 : 0.9;
  setViewBox(prev => ({
    ...prev,
    width: prev.width * scale,
    height: prev.height * scale,
  }));
};
```

**Tests**:
- Scroll zooms in/out
- Drag pans the view

**Verification**: Manual testing

---

## Testing Strategy

### Unit Tests
```bash
npm test -- services/       # MindMapService, SearchService
npm test -- input/          # ModeManager, KeyHandler, Commands
npm test -- storage/        # Repository
npm test -- layout/         # HierarchicalLayout
npm test -- stores/         # Zustand stores
```

### Integration Tests
```bash
npm test -- integration/    # Full keyboard flows
```

### Full Suite
```bash
npm test
```

### Coverage Targets
- Services: 90%+
- Input handling: 90%+
- Stores: 85%+
- UI components: 70%+

---

## Task Summary

| Phase | Tasks | Hours |
|-------|-------|-------|
| 0. Setup | Project init, Vite, Tailwind, Vitest | 1 |
| 1. Foundation | Types, Repository, MindMapService | 3-4 |
| 2. Input | Mode, KeyHandler, Commands | 4-6 |
| 3. Layout | Hierarchical layout | 2-3 |
| 4. Search | Fuse.js integration | 1-2 |
| 5. UI | Stores, Components, Hooks | 8-12 |
| 6. Polish | Styles, Zoom/Pan | 3-5 |
| **Total** | | **22-33 hours** |

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "fuse.js": "^7.0.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^23.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## Success Criteria

MVP is complete when:

1. ✅ Navigate with `h`, `j`, `k`, `l` (or arrow keys)
2. ✅ Create child node with `a`
3. ✅ Create sibling node with `o`
4. ✅ Edit node with `i`, exit with `Escape`
5. ✅ Delete node with `dd`
6. ✅ Delete with children with `gd`
7. ✅ Clear and edit with `cin`
8. ✅ Search with `/`
9. ✅ Command palette with `Cmd+K`
10. ✅ Mode indicator visible
11. ✅ All tests pass

---

## Future Enhancements (Not MVP)

When you need them, add:

| Feature | When to Add |
|---------|-------------|
| Undo/Redo | After MVP, when users request it |
| Backend sync | When collaboration is needed |
| Multiple maps | When users want organization |
| Export/Import | When sharing is needed |
| Better layouts | When maps get complex |

**Principle**: Ship the MVP. Add complexity when you feel pain.
