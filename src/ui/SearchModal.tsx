import { useState, useEffect, useRef, useMemo } from 'react';
import { useNodeStore, useUIStore } from '../stores';
import { createSearchService } from '../services/searchService';

export function SearchModal() {
  const nodes = useNodeStore((state) => state.nodes);
  const selectNode = useNodeStore((state) => state.selectNode);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const closeSearch = useUIStore((state) => state.closeSearch);

  const searchService = useMemo(() => createSearchService(nodes), [nodes]);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query ? searchService.search(query) : nodes.map((n) => ({ nodeId: n.id, content: n.content }));

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
        if (results[clampedIndex]) {
          selectNode(results[clampedIndex].nodeId);
          handleClose();
        }
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
        {results.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {results.map((result, i) => (
              <div
                key={result.nodeId}
                className={`px-4 py-2 cursor-pointer ${
                  i === clampedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  selectNode(result.nodeId);
                  handleClose();
                }}
              >
                {result.content || <span className="text-gray-400 italic">Empty node</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">No nodes found</div>
        )}
      </div>
    </div>
  );
}
