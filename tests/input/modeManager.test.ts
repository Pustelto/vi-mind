import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createModeManager, ModeManager } from '../../src/input/modeManager';

describe('ModeManager', () => {
  let modeManager: ModeManager;

  beforeEach(() => {
    modeManager = createModeManager();
  });

  describe('initial state', () => {
    it('should start in normal mode', () => {
      expect(modeManager.getMode()).toBe('normal');
    });

    it('should report isNormalMode as true', () => {
      expect(modeManager.isNormalMode()).toBe(true);
    });

    it('should report isInsertMode as false', () => {
      expect(modeManager.isInsertMode()).toBe(false);
    });
  });

  describe('enterInsertMode', () => {
    it('should change mode to insert', () => {
      modeManager.enterInsertMode();

      expect(modeManager.getMode()).toBe('insert');
      expect(modeManager.isInsertMode()).toBe(true);
      expect(modeManager.isNormalMode()).toBe(false);
    });

    it('should not notify if already in insert mode', () => {
      modeManager.enterInsertMode();
      const listener = vi.fn();
      modeManager.onModeChange(listener);

      modeManager.enterInsertMode();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('exitInsertMode', () => {
    it('should change mode to normal', () => {
      modeManager.enterInsertMode();
      modeManager.exitInsertMode();

      expect(modeManager.getMode()).toBe('normal');
      expect(modeManager.isNormalMode()).toBe(true);
      expect(modeManager.isInsertMode()).toBe(false);
    });

    it('should not notify if already in normal mode', () => {
      const listener = vi.fn();
      modeManager.onModeChange(listener);

      modeManager.exitInsertMode();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('onModeChange', () => {
    it('should notify listener when mode changes', () => {
      const listener = vi.fn();
      modeManager.onModeChange(listener);

      modeManager.enterInsertMode();

      expect(listener).toHaveBeenCalledWith('insert');
    });

    it('should notify multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      modeManager.onModeChange(listener1);
      modeManager.onModeChange(listener2);

      modeManager.enterInsertMode();

      expect(listener1).toHaveBeenCalledWith('insert');
      expect(listener2).toHaveBeenCalledWith('insert');
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = modeManager.onModeChange(listener);

      unsubscribe();
      modeManager.enterInsertMode();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
