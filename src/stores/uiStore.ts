import { create } from 'zustand';
import type { Mode } from '../types';

interface UIState {
  mode: Mode;
  isSearchOpen: boolean;
  isCommandPaletteOpen: boolean;
  error: string | null;

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
