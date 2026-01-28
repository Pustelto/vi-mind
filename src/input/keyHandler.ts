import type { Mode, CommandDefinition, CommandContext } from '../types';

export interface KeyHandler {
  handleKeyDown(event: KeyboardEvent, context: CommandContext): boolean;
  getCommands(): CommandDefinition[];
  getCommandsByMode(mode: Mode): CommandDefinition[];
}

export function createKeyHandler(commands: CommandDefinition[]): KeyHandler {
  let keyBuffer = '';
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const TIMEOUT_MS = 1000;

  const resetBuffer = () => {
    keyBuffer = '';
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const findExactMatch = (keys: string, mode: Mode): CommandDefinition | null => {
    return (
      commands.find((cmd) => cmd.keybindings.includes(keys) && cmd.modes.includes(mode)) ?? null
    );
  };

  const findPrefixMatches = (keys: string, mode: Mode): CommandDefinition[] => {
    return commands.filter(
      (cmd) =>
        cmd.modes.includes(mode) && cmd.keybindings.some((kb) => kb.startsWith(keys) && kb !== keys)
    );
  };

  const handleKeyDown = (event: KeyboardEvent, context: CommandContext): boolean => {
    const key = event.key;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? event.metaKey : event.ctrlKey;

    if (key === 'Escape') {
      const escCmd = findExactMatch('Escape', context.mode);
      if (escCmd && (!escCmd.canExecute || escCmd.canExecute(context))) {
        escCmd.execute(context);
        resetBuffer();
        return true;
      }
    }

    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return false;
    }

    if ((event.metaKey || event.ctrlKey) && key === 'k') {
      context.openCommandPalette();
      resetBuffer();
      return true;
    }

    if ((event.metaKey || event.ctrlKey) && key === 'c' && context.mode === 'normal') {
      context.copyNodeContent();
      resetBuffer();
      return true;
    }

    if (modKey && (key === '=' || key === '+')) {
      context.zoomCanvas('in');
      resetBuffer();
      return true;
    }

    if (modKey && key === '-') {
      context.zoomCanvas('out');
      resetBuffer();
      return true;
    }

    if (event.ctrlKey && key === '0') {
      context.fitToView();
      resetBuffer();
      return true;
    }

    if (event.ctrlKey && context.mode === 'normal') {
      switch (key) {
        case 'h':
          context.panCanvas('left');
          resetBuffer();
          return true;
        case 'j':
          context.panCanvas('down');
          resetBuffer();
          return true;
        case 'k':
          context.panCanvas('up');
          resetBuffer();
          return true;
        case 'l':
          context.panCanvas('right');
          resetBuffer();
          return true;
      }
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    keyBuffer += key;

    const exactMatch = findExactMatch(keyBuffer, context.mode);
    if (exactMatch && (!exactMatch.canExecute || exactMatch.canExecute(context))) {
      exactMatch.execute(context);
      resetBuffer();
      return true;
    }

    const prefixMatches = findPrefixMatches(keyBuffer, context.mode);
    if (prefixMatches.length > 0) {
      timeoutId = setTimeout(resetBuffer, TIMEOUT_MS);
      return true;
    }

    resetBuffer();
    return false;
  };

  return {
    handleKeyDown,
    getCommands: () => [...commands],
    getCommandsByMode: (mode) => commands.filter((cmd) => cmd.modes.includes(mode)),
  };
}
