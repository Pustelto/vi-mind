import { useEffect } from 'react';
import { useNodeStore, useUIStore } from '../stores';
import { createLocalStorageRepository } from '../storage/repository';
import { createMindMapService } from '../services/mindMapService';
import { MindMapCanvas } from './MindMapCanvas';
import { ModeIndicator } from './ModeIndicator';
import { SearchModal } from './SearchModal';
import { CommandPalette } from './CommandPalette';
import { HelpButton } from './HelpButton';
import { ExternalLinks } from './ExternalLinks';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export function App() {
  const initialize = useNodeStore((state) => state.initialize);
  const error = useUIStore((state) => state.error);
  const setError = useUIStore((state) => state.setError);

  useEffect(() => {
    const repository = createLocalStorageRepository();
    const service = createMindMapService(repository);
    initialize(service);
  }, [initialize]);

  useKeyboardShortcuts();

  return (
    <div className="w-screen h-screen overflow-hidden">
      <MindMapCanvas />
      <ModeIndicator />
      <SearchModal />
      <CommandPalette />
      <HelpButton />
      <ExternalLinks />
      {error && (
        <div
          className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded cursor-pointer"
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}
    </div>
  );
}
