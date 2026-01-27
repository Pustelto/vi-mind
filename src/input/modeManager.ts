import type { Mode } from '../types';

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
    listeners.forEach((fn) => fn(currentMode));
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
      return () => {
        listeners.delete(handler);
      };
    },
  };
}
