# ViMind

A fast, keyboard-first mind mapping tool built with React. Navigate, create, and organize your thoughts using VIM-like keybindings without ever touching the mouse.

## Features

- **VIM-like Navigation** - Use `h/j/k/l` or arrow keys to navigate between nodes
- **Modal Editing** - Normal mode for navigation, Insert mode for editing (just like VIM)
- **Keyboard-First Design** - All operations accessible via keyboard shortcuts
- **Local Storage Persistence** - Your mind maps are saved automatically in browser storage
- **Search** - Fuzzy search across all nodes with `/`
- **Command Palette** - Quick access to all commands with `Cmd/Ctrl+K` or `:`
- **Export** - Export your mind map as SVG or PNG
- **Clean, Minimal UI** - Focus on your ideas, not the interface

## Demo

Try it live: [ViMind](https://tomaspustelnik.github.io/vi-mind/)

## Keyboard Shortcuts

### Navigation (Normal Mode)

| Key | Action |
|-----|--------|
| `h` / `ArrowLeft` | Go to parent node |
| `l` / `ArrowRight` | Go to first child |
| `j` / `ArrowDown` | Go to next sibling |
| `k` / `ArrowUp` | Go to previous sibling |

### Node Operations

| Key | Action |
|-----|--------|
| `a` | Create child node (or root if canvas is empty) |
| `o` | Create sibling below |
| `O` | Create sibling above |
| `I` | Insert parent between selected node and its parent |
| `i` | Enter insert mode (edit node content) |
| `dd` | Delete node (leaf only) |
| `gd` | Delete node with all children |
| `cin` | Clear content and enter insert mode |
| `yy` | Copy node content |
| `Cmd/Ctrl+C` | Copy node content |

### Insert Mode

| Key | Action |
|-----|--------|
| `Enter` | New line in node text |
| `Cmd/Ctrl+Enter` | Exit insert mode and save |
| `Escape` | Exit insert mode and save |

### View Controls

| Key | Action |
|-----|--------|
| `zz` | Center and zoom on current node |
| `gg` | Fit entire mind map to screen |
| Mouse wheel | Zoom in/out (centered on cursor) |
| Click and drag | Pan canvas |

### Search & Commands

| Key | Action |
|-----|--------|
| `/` | Open search (shows all nodes when empty) |
| `:` | Open command palette |
| `Cmd/Ctrl+K` | Open command palette |

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **Tailwind CSS 4** - Styling
- **Vite** - Build tool
- **Vitest** - Testing

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests once
npm run test:run

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Format code
npm run format
```

## Architecture

The codebase follows a clean architecture with separation of concerns:

```
src/
├── types.ts            # TypeScript types
├── services/           # Business logic (MindMapService, SearchService)
├── storage/            # Repository pattern (localStorage, in-memory)
├── layout/             # Layout calculation (pure functions)
├── input/              # Keyboard handling (ModeManager, KeyHandler, Commands)
├── ui/                 # React components
│   └── hooks/          # React hooks
└── stores/             # Zustand stores (nodeStore, uiStore)
```

Key patterns:
- **Repository Pattern** - Async interface for storage backends
- **Result Pattern** - Explicit error handling without exceptions
- **Command Registry** - First-class command objects for keybindings
- **Pure Layout Functions** - `(nodes) => LayoutResult`

## Known Limitations

This is an experimental project built for learning and personal use. It has several limitations:

### Mouse/Touch Support
- **Limited mouse interaction** - Only basic pan and zoom with mouse
- **No drag-and-drop** - Nodes cannot be rearranged by dragging
- **No touch support** - Not optimized for tablets or mobile devices

### Accessibility
- **Keyboard-only focus** - Screen reader support is minimal
- **No ARIA live regions** - Mode changes not announced
- **Limited color contrast options** - No high contrast mode
- **No reduced motion support** - Animations cannot be disabled

### Data
- **Browser-only storage** - Data stored in localStorage only
- **No sync** - No cloud sync or backup
- **No import/export** - Cannot import from other mind map formats
- **Single mind map** - Only one mind map per browser

### Other
- **Desktop-first** - Not responsive for small screens
- **Limited undo** - No undo/redo functionality
- **No collaboration** - Single user only
- **No images** - Text-only nodes

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](LICENSE) for details.
