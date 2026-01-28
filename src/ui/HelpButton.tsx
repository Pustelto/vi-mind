import { useState, useRef, useEffect } from 'react';

interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { key: 'h / ←', description: 'Go to parent' },
      { key: 'l / →', description: 'Go to first child' },
      { key: 'j / ↓', description: 'Go to next sibling' },
      { key: 'k / ↑', description: 'Go to previous sibling' },
      { key: 'gg', description: 'Go to root node' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { key: 'a', description: 'Create child node' },
      { key: 'o', description: 'Create sibling below' },
      { key: 'O', description: 'Create sibling above' },
      { key: 'I', description: 'Insert between parent' },
      { key: 'i', description: 'Edit node content' },
      { key: 'dd', description: 'Delete node' },
      { key: 'dG', description: 'Delete all children' },
      { key: 'yy', description: 'Copy node content' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { key: 'Ctrl+h/j/k/l', description: 'Pan canvas' },
      { key: 'Cmd/Ctrl + / -', description: 'Zoom in/out' },
      { key: 'Ctrl+0', description: 'Fit to view' },
      { key: 'zz', description: 'Focus current node' },
    ],
  },
  {
    title: 'Other',
    shortcuts: [
      { key: '/', description: 'Search nodes' },
      { key: ':', description: 'Command palette' },
      { key: 'Cmd/Ctrl+K', description: 'Command palette' },
      { key: 'Esc', description: 'Exit insert mode' },
    ],
  },
];

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if (e.key === '?' && !isOpen) {
        const target = e.target as Element;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        aria-label="Keyboard shortcuts help"
      >
        <span className="text-lg font-medium">?</span>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800">Keyboard Shortcuts</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {shortcutGroups.map((group) => (
              <div key={group.title} className="px-4 py-3 border-b last:border-b-0">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group.title}
                </h4>
                <div className="space-y-1.5">
                  {group.shortcuts.map((shortcut) => (
                    <div key={shortcut.key} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{shortcut.description}</span>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-700">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
