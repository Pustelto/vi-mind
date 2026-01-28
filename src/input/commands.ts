import type { CommandDefinition } from '../types';

export function createCommands(): CommandDefinition[] {
  return [
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
    {
      id: 'edit.createChild',
      name: 'Create Child Node',
      description: 'Create a new child node and enter insert mode',
      keybindings: ['a'],
      modes: ['normal'],
      execute: (ctx) => {
        if (!ctx.hasNodes) {
          ctx.createRootNode();
        } else if (ctx.selectedNodeId) {
          ctx.createChildNode(ctx.selectedNodeId);
        }
      },
    },
    {
      id: 'edit.createSiblingBelow',
      name: 'Create Sibling Below',
      description: 'Create a new sibling node below and enter insert mode',
      keybindings: ['o'],
      modes: ['normal'],
      execute: (ctx) => {
        if (ctx.selectedNodeId) {
          ctx.createSiblingBelow(ctx.selectedNodeId);
        }
      },
      canExecute: (ctx) => ctx.selectedNodeId !== null && !ctx.isSelectedNodeRoot,
    },
    {
      id: 'edit.createSiblingAbove',
      name: 'Create Sibling Above',
      description: 'Create a new sibling node above and enter insert mode',
      keybindings: ['O'],
      modes: ['normal'],
      execute: (ctx) => {
        if (ctx.selectedNodeId) {
          ctx.createSiblingAbove(ctx.selectedNodeId);
        }
      },
      canExecute: (ctx) => ctx.selectedNodeId !== null && !ctx.isSelectedNodeRoot,
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
    {
      id: 'mode.exitInsert',
      name: 'Exit Insert Mode',
      description: 'Return to normal mode',
      keybindings: ['Escape'],
      modes: ['insert'],
      execute: (ctx) => ctx.exitInsertMode(),
    },
    {
      id: 'search.open',
      name: 'Search Nodes',
      description: 'Open search to find nodes by content',
      keybindings: ['/'],
      modes: ['normal'],
      execute: (ctx) => ctx.openSearch(),
    },
    {
      id: 'command.openPalette',
      name: 'Open Command Palette',
      description: 'Open command palette to run commands',
      keybindings: [':'],
      modes: ['normal'],
      execute: (ctx) => ctx.openCommandPalette(),
    },
    {
      id: 'view.fitToView',
      name: 'Fit to View',
      description: 'Fit entire mind map to screen',
      keybindings: ['zz'],
      modes: ['normal'],
      execute: (ctx) => ctx.fitToView(),
    },
  ];
}
