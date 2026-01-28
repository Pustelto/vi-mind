import { describe, it, expect } from 'vitest';
import { createCommands } from '../../src/input/commands';

describe('Command Definitions', () => {
  const commands = createCommands();

  describe('structure', () => {
    it('should have all required fields', () => {
      for (const cmd of commands) {
        expect(cmd.id).toBeDefined();
        expect(cmd.name).toBeDefined();
        expect(cmd.description).toBeDefined();
        expect(cmd.keybindings).toBeDefined();
        expect(cmd.modes).toBeDefined();
        expect(cmd.modes.length).toBeGreaterThan(0);
        expect(cmd.execute).toBeDefined();
      }
    });

    it('should have unique command ids', () => {
      const ids = commands.map((cmd) => cmd.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique keybindings within same mode', () => {
      const normalBindings = new Set<string>();
      const insertBindings = new Set<string>();

      for (const cmd of commands) {
        for (const binding of cmd.keybindings) {
          if (cmd.modes.includes('normal')) {
            expect(normalBindings.has(binding)).toBe(false);
            normalBindings.add(binding);
          }
          if (cmd.modes.includes('insert')) {
            expect(insertBindings.has(binding)).toBe(false);
            insertBindings.add(binding);
          }
        }
      }
    });
  });

  describe('navigation commands', () => {
    it('should have nav.parent command', () => {
      const cmd = commands.find((c) => c.id === 'nav.parent');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('h');
      expect(cmd?.keybindings).toContain('ArrowLeft');
      expect(cmd?.modes).toContain('normal');
    });

    it('should have nav.child command', () => {
      const cmd = commands.find((c) => c.id === 'nav.child');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('l');
      expect(cmd?.keybindings).toContain('ArrowRight');
    });

    it('should have nav.nextSibling command', () => {
      const cmd = commands.find((c) => c.id === 'nav.nextSibling');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('j');
      expect(cmd?.keybindings).toContain('ArrowDown');
    });

    it('should have nav.prevSibling command', () => {
      const cmd = commands.find((c) => c.id === 'nav.prevSibling');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('k');
      expect(cmd?.keybindings).toContain('ArrowUp');
    });
  });

  describe('editing commands', () => {
    it('should have edit.createChild command', () => {
      const cmd = commands.find((c) => c.id === 'edit.createChild');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('a');
    });

    it('should have edit.createSiblingBelow command', () => {
      const cmd = commands.find((c) => c.id === 'edit.createSiblingBelow');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('o');
    });

    it('should have edit.createSiblingAbove command', () => {
      const cmd = commands.find((c) => c.id === 'edit.createSiblingAbove');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('O');
    });

    it('should have edit.delete command (dd)', () => {
      const cmd = commands.find((c) => c.id === 'edit.delete');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('dd');
    });

    it('should have edit.deleteWithChildren command (gd)', () => {
      const cmd = commands.find((c) => c.id === 'edit.deleteWithChildren');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('gd');
    });

    it('should have edit.enterInsert command', () => {
      const cmd = commands.find((c) => c.id === 'edit.enterInsert');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('i');
    });

    it('should have edit.changeNode command (cin)', () => {
      const cmd = commands.find((c) => c.id === 'edit.changeNode');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('cin');
    });
  });

  describe('mode commands', () => {
    it('should have mode.exitInsert command', () => {
      const cmd = commands.find((c) => c.id === 'mode.exitInsert');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('Escape');
      expect(cmd?.modes).toContain('insert');
    });
  });

  describe('search commands', () => {
    it('should have search.open command', () => {
      const cmd = commands.find((c) => c.id === 'search.open');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('/');
    });
  });

  describe('view commands', () => {
    it('should have view.fitToView command', () => {
      const cmd = commands.find((c) => c.id === 'view.fitToView');
      expect(cmd).toBeDefined();
    });

    it('should have view.focusNode command (zz)', () => {
      const cmd = commands.find((c) => c.id === 'view.focusNode');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('zz');
    });
  });

  describe('navigation to root', () => {
    it('should have nav.root command (gg)', () => {
      const cmd = commands.find((c) => c.id === 'nav.root');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('gg');
      expect(cmd?.modes).toContain('normal');
    });
  });

  describe('clipboard commands', () => {
    it('should have edit.copyNode command (yy)', () => {
      const cmd = commands.find((c) => c.id === 'edit.copyNode');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('yy');
    });
  });

  describe('structure commands', () => {
    it('should have edit.insertBetween command (I)', () => {
      const cmd = commands.find((c) => c.id === 'edit.insertBetween');
      expect(cmd).toBeDefined();
      expect(cmd?.keybindings).toContain('I');
    });
  });
});
