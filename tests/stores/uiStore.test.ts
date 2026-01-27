import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../src/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      mode: 'normal',
      isSearchOpen: false,
      isCommandPaletteOpen: false,
      error: null,
    });
  });

  describe('mode', () => {
    it('should start in normal mode', () => {
      expect(useUIStore.getState().mode).toBe('normal');
    });

    it('should enter insert mode', () => {
      useUIStore.getState().enterInsertMode();
      expect(useUIStore.getState().mode).toBe('insert');
    });

    it('should exit insert mode', () => {
      useUIStore.getState().enterInsertMode();
      useUIStore.getState().exitInsertMode();
      expect(useUIStore.getState().mode).toBe('normal');
    });

    it('should set mode directly', () => {
      useUIStore.getState().setMode('insert');
      expect(useUIStore.getState().mode).toBe('insert');
    });
  });

  describe('search', () => {
    it('should open search', () => {
      useUIStore.getState().openSearch();
      expect(useUIStore.getState().isSearchOpen).toBe(true);
    });

    it('should close search', () => {
      useUIStore.getState().openSearch();
      useUIStore.getState().closeSearch();
      expect(useUIStore.getState().isSearchOpen).toBe(false);
    });
  });

  describe('command palette', () => {
    it('should open command palette', () => {
      useUIStore.getState().openCommandPalette();
      expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);
    });

    it('should close command palette', () => {
      useUIStore.getState().openCommandPalette();
      useUIStore.getState().closeCommandPalette();
      expect(useUIStore.getState().isCommandPaletteOpen).toBe(false);
    });
  });

  describe('error', () => {
    it('should set error', () => {
      useUIStore.getState().setError('Test error');
      expect(useUIStore.getState().error).toBe('Test error');
    });

    it('should clear error', () => {
      useUIStore.getState().setError('Test error');
      useUIStore.getState().setError(null);
      expect(useUIStore.getState().error).toBeNull();
    });
  });
});
