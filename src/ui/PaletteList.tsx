import { useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface PaletteItem {
  id: string;
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
}

interface Props {
  items: PaletteItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  emptyMessage?: string;
}

export function PaletteList({ items, selectedIndex, onSelect, emptyMessage = 'No results found' }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const clampedIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));

  useEffect(() => {
    if (listRef.current && items.length > 0) {
      const selectedElement = listRef.current.children[clampedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [clampedIndex, items.length]);

  if (items.length === 0) {
    return <div className="px-4 py-8 text-center text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div ref={listRef} className="max-h-80 overflow-y-auto">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`px-4 py-2 cursor-pointer flex justify-between items-center ${
            i === clampedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
          }`}
          onClick={() => onSelect(i)}
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{item.primary}</div>
            {item.secondary && <div className="text-sm text-gray-500 truncate">{item.secondary}</div>}
          </div>
          {item.trailing && (
            <div className="text-sm text-gray-400 font-mono ml-2 flex-shrink-0">{item.trailing}</div>
          )}
        </div>
      ))}
    </div>
  );
}
