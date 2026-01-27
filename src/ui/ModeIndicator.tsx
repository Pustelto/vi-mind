import { useUIStore } from '../stores';

export function ModeIndicator() {
  const mode = useUIStore((state) => state.mode);

  return (
    <div
      className={`fixed bottom-4 left-4 px-3 py-1 rounded font-mono text-sm ${
        mode === 'normal' ? 'bg-gray-800 text-white' : 'bg-green-600 text-white'
      }`}
    >
      -- {mode.toUpperCase()} --
    </div>
  );
}
