# Mind Map Project - Development Guidelines

## Project Overview

A VIM-like keyboard-first mind mapping tool built with React.

## Architecture

```
src/
├── types.ts            # All TypeScript types
├── services/           # Business logic (MindMapService, SearchService)
├── storage/            # Repository pattern (async interface)
├── layout/             # Layout calculation (pure functions)
├── input/              # Keyboard handling (ModeManager, KeyHandler, Commands)
├── ui/                 # React components
│   └── hooks/          # React hooks
├── stores/             # Zustand stores (nodeStore, uiStore)
└── test/               # Test setup

tests/                  # Test files mirror src structure
```

## Key Patterns & Decisions

### 1. Result Pattern for Error Handling
Services return `Result<T, E>` instead of throwing:
```typescript
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
```

### 2. Repository Pattern (Async)
All storage operations are async to support future backends (IndexedDB, API).

### 3. Command Registry
Commands are first-class objects with explicit registration for keybindings and command palette.

### 4. Zustand for State
Two focused stores: `useNodeStore` (nodes, selection) and `useUIStore` (mode, modals).

### 5. Pure Functions for Layout
Layout calculation is a pure function: `(nodes) => LayoutResult`.

### 6. Node Ordering
Nodes have an `order` field for sibling positioning. Repository sorts children by order.
- `createSiblingAbove` inserts before current node
- `createSiblingBelow` inserts after current node

### 7. Empty State Initialization
- Store initializes with empty nodes (no auto-create root)
- Pressing `a` on empty canvas creates root node
- Welcome screen shows on empty canvas with instructions

### 8. Dynamic Node Sizing
- Node dimensions calculated from content (line count, max line length)
- Dimensions update live during editing via callback pattern
- Constants: MIN_NODE_WIDTH=80, MAX_NODE_WIDTH=250

## Testing

- Run tests: `npm test` (watch) or `npm run test:run` (once)
- Tests mirror src structure in `tests/` folder
- Focus on testing services and input handling

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests once
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

## Implementation Notes

- Tailwind CSS 4.x uses `@import 'tailwindcss'` syntax
- Tailwind CSS 4.x requires `@tailwindcss/postcss` in postcss.config.js
- Vitest requires `/// <reference types="vitest/config" />` (not `vitest`)
- Vitest configured with jsdom environment for React testing
- ESLint 9 with flat config
- React 19 with strict mode enabled

## Keyboard Shortcuts (VIM-like)

Navigation:
- `h` / `ArrowLeft` - Go to parent
- `l` / `ArrowRight` - Go to first child
- `j` / `ArrowDown` - Go to next sibling
- `k` / `ArrowUp` - Go to previous sibling

Editing:
- `a` - Create child node (or root if empty canvas)
- `o` - Create sibling below (disabled on root)
- `O` - Create sibling above (disabled on root)
- `i` - Enter insert mode
- `dd` - Delete node (leaf only)
- `gd` - Delete node with children
- `cin` - Clear content and enter insert mode

Insert Mode:
- `Enter` - New line in node text
- `Cmd/Ctrl+Enter` - Exit insert mode and save
- `Escape` - Exit insert mode and save

View:
- `zz` - Fit entire mind map to screen (centered)

Search:
- `/` - Open search modal
- `Cmd/Ctrl+K` - Open command palette

Canvas:
- Mouse wheel - Zoom in/out (centered on cursor)
- Click and drag - Pan canvas

## ESLint Rules to Watch

- `react-hooks/set-state-in-effect` - Don't call setState in effects
- `react-hooks/refs` - Don't access refs during render
- Use `clampedIndex` pattern instead of effect-based index reset
