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
- Vitest configured with jsdom environment for React testing
- ESLint 9 with flat config
