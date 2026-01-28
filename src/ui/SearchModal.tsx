import { useState, useEffect, useRef, useMemo } from 'react';
import { useNodeStore, useUIStore } from '../stores';
import { createSearchService } from '../services/searchService';
import { PaletteList } from './PaletteList';
import type { PaletteItem } from './PaletteList';

export function SearchModal() {
  const nodes = useNodeStore((state) => state.nodes);
  const selectNode = useNodeStore((state) => state.selectNode);
  const focusNode = useNodeStore((state) => state.focusNode);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const closeSearch = useUIStore((state) => state.closeSearch);

  const searchService = useMemo(() => createSearchService(nodes), [nodes]);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query
    ? searchService.search(query)
    : nodes.map((n) => ({ nodeId: n.id, content: n.content }));

  const items: PaletteItem[] = results.map((result) => ({
    id: result.nodeId,
    primary: result.content || <span className="text-gray-400 italic">Empty node</span>,
  }));

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  };

  const clampedIndex = Math.min(selectedIndex, Math.max(0, results.length - 1));

  const handleSelect = (index: number) => {
    const result = results[index];
    if (result) {
      const nodeId = result.nodeId;
      selectNode(nodeId);
      handleClose();
      requestAnimationFrame(() => {
        if (focusNode) focusNode(nodeId);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(clampedIndex);
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  const handleClose = () => {
    setQuery('');
    setSelectedIndex(0);
    closeSearch();
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b">
          <span className="text-gray-400 mr-2">/</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes..."
            className="flex-1 outline-none"
          />
        </div>
        <PaletteList
          items={items}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          emptyMessage="No nodes found"
        />
      </div>
    </div>
  );
}
