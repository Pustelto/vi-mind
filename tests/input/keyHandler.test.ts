import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createKeyHandler, KeyHandler } from '../../src/input/keyHandler';
import type { CommandDefinition, CommandContext } from '../../src/types';

describe('KeyHandler', () => {
  let keyHandler: KeyHandler;
  let mockContext: CommandContext;

  const createMockEvent = (key: string, options: Partial<KeyboardEvent> = {}): KeyboardEvent => {
    return {
      key,
      target: document.body,
      metaKey: false,
      ctrlKey: false,
      ...options,
    } as KeyboardEvent;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    mockContext = {
      selectedNodeId: 'node-1',
      mode: 'normal',
      selectNode: vi.fn(),
      createChildNode: vi.fn(),
      createSiblingNode: vi.fn(),
      updateNodeContent: vi.fn(),
      deleteNode: vi.fn(),
      deleteNodeWithChildren: vi.fn(),
      enterInsertMode: vi.fn(),
      exitInsertMode: vi.fn(),
      navigateToParent: vi.fn(),
      navigateToFirstChild: vi.fn(),
      navigateToNextSibling: vi.fn(),
      navigateToPreviousSibling: vi.fn(),
      openSearch: vi.fn(),
      openCommandPalette: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('single key commands', () => {
    it('should execute single key command immediately', () => {
      const execute = vi.fn();
      const commands: CommandDefinition[] = [
        {
          id: 'test',
          name: 'Test',
          description: 'Test command',
          keybindings: ['j'],
          modes: ['normal'],
          execute,
        },
      ];
      keyHandler = createKeyHandler(commands);

      const handled = keyHandler.handleKeyDown(createMockEvent('j'), mockContext);

      expect(handled).toBe(true);
      expect(execute).toHaveBeenCalledWith(mockContext);
    });

    it('should not execute command in wrong mode', () => {
      const execute = vi.fn();
      const commands: CommandDefinition[] = [
        {
          id: 'test',
          name: 'Test',
          description: 'Test command',
          keybindings: ['j'],
          modes: ['normal'],
          execute,
        },
      ];
      keyHandler = createKeyHandler(commands);
      mockContext.mode = 'insert';

      const handled = keyHandler.handleKeyDown(createMockEvent('j'), mockContext);

      expect(handled).toBe(false);
      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('multi-key commands', () => {
    it('should wait for complete sequence', () => {
      const execute = vi.fn();
      const commands: CommandDefinition[] = [
        {
          id: 'delete',
          name: 'Delete',
          description: 'Delete node',
          keybindings: ['dd'],
          modes: ['normal'],
          execute,
        },
      ];
      keyHandler = createKeyHandler(commands);

      const handled1 = keyHandler.handleKeyDown(createMockEvent('d'), mockContext);

      expect(handled1).toBe(true);
      expect(execute).not.toHaveBeenCalled();

      const handled2 = keyHandler.handleKeyDown(createMockEvent('d'), mockContext);

      expect(handled2).toBe(true);
      expect(execute).toHaveBeenCalledWith(mockContext);
    });

    it('should execute three-key command (cin)', () => {
      const execute = vi.fn();
      const commands: CommandDefinition[] = [
        {
          id: 'change',
          name: 'Change',
          description: 'Change node',
          keybindings: ['cin'],
          modes: ['normal'],
          execute,
        },
      ];
      keyHandler = createKeyHandler(commands);

      keyHandler.handleKeyDown(createMockEvent('c'), mockContext);
      keyHandler.handleKeyDown(createMockEvent('i'), mockContext);
      keyHandler.handleKeyDown(createMockEvent('n'), mockContext);

      expect(execute).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('buffer timeout', () => {
    it('should reset buffer after timeout', () => {
      const execute = vi.fn();
      const commands: CommandDefinition[] = [
        {
          id: 'delete',
          name: 'Delete',
          description: 'Delete node',
          keybindings: ['dd'],
          modes: ['normal'],
          execute,
        },
      ];
      keyHandler = createKeyHandler(commands);

      keyHandler.handleKeyDown(createMockEvent('d'), mockContext);
      vi.advanceTimersByTime(1100);
      keyHandler.handleKeyDown(createMockEvent('d'), mockContext);

      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('canExecute', () => {
    it('should not execute when canExecute returns false', () => {
      const execute = vi.fn();
      const commands: CommandDefinition[] = [
        {
          id: 'test',
          name: 'Test',
          description: 'Test command',
          keybindings: ['j'],
          modes: ['normal'],
          execute,
          canExecute: () => false,
        },
      ];
      keyHandler = createKeyHandler(commands);

      const handled = keyHandler.handleKeyDown(createMockEvent('j'), mockContext);

      expect(handled).toBe(false);
      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('Escape handling', () => {
    it('should always handle Escape even in inputs', () => {
      const execute = vi.fn();
      const commands: CommandDefinition[] = [
        {
          id: 'exit',
          name: 'Exit',
          description: 'Exit insert mode',
          keybindings: ['Escape'],
          modes: ['insert'],
          execute,
        },
      ];
      keyHandler = createKeyHandler(commands);
      mockContext.mode = 'insert';

      const input = document.createElement('input');
      const event = createMockEvent('Escape', { target: input as EventTarget });

      const handled = keyHandler.handleKeyDown(event, mockContext);

      expect(handled).toBe(true);
      expect(execute).toHaveBeenCalled();
    });
  });

  describe('Cmd+K handling', () => {
    it('should open command palette with Cmd+K', () => {
      keyHandler = createKeyHandler([]);
      const event = createMockEvent('k', { metaKey: true });

      const handled = keyHandler.handleKeyDown(event, mockContext);

      expect(handled).toBe(true);
      expect(mockContext.openCommandPalette).toHaveBeenCalled();
    });

    it('should open command palette with Ctrl+K', () => {
      keyHandler = createKeyHandler([]);
      const event = createMockEvent('k', { ctrlKey: true });

      const handled = keyHandler.handleKeyDown(event, mockContext);

      expect(handled).toBe(true);
      expect(mockContext.openCommandPalette).toHaveBeenCalled();
    });
  });

  describe('input field handling', () => {
    it('should ignore keys in input fields (except Escape)', () => {
      const execute = vi.fn();
      const commands: CommandDefinition[] = [
        {
          id: 'test',
          name: 'Test',
          description: 'Test command',
          keybindings: ['j'],
          modes: ['normal'],
          execute,
        },
      ];
      keyHandler = createKeyHandler(commands);

      const input = document.createElement('input');
      const event = createMockEvent('j', { target: input as EventTarget });

      const handled = keyHandler.handleKeyDown(event, mockContext);

      expect(handled).toBe(false);
      expect(execute).not.toHaveBeenCalled();
    });
  });

  describe('getCommands', () => {
    it('should return all commands', () => {
      const commands: CommandDefinition[] = [
        {
          id: 'cmd1',
          name: 'Command 1',
          description: 'First',
          keybindings: ['a'],
          modes: ['normal'],
          execute: vi.fn(),
        },
        {
          id: 'cmd2',
          name: 'Command 2',
          description: 'Second',
          keybindings: ['b'],
          modes: ['insert'],
          execute: vi.fn(),
        },
      ];
      keyHandler = createKeyHandler(commands);

      expect(keyHandler.getCommands()).toHaveLength(2);
    });
  });

  describe('getCommandsByMode', () => {
    it('should filter commands by mode', () => {
      const commands: CommandDefinition[] = [
        {
          id: 'cmd1',
          name: 'Command 1',
          description: 'Normal mode',
          keybindings: ['a'],
          modes: ['normal'],
          execute: vi.fn(),
        },
        {
          id: 'cmd2',
          name: 'Command 2',
          description: 'Insert mode',
          keybindings: ['b'],
          modes: ['insert'],
          execute: vi.fn(),
        },
        {
          id: 'cmd3',
          name: 'Command 3',
          description: 'Both modes',
          keybindings: ['c'],
          modes: ['normal', 'insert'],
          execute: vi.fn(),
        },
      ];
      keyHandler = createKeyHandler(commands);

      const normalCommands = keyHandler.getCommandsByMode('normal');
      const insertCommands = keyHandler.getCommandsByMode('insert');

      expect(normalCommands).toHaveLength(2);
      expect(insertCommands).toHaveLength(2);
    });
  });
});
