import { useState, useEffect, useRef, useMemo } from 'react';
import { useNodeStore, useUIStore } from '../stores';
import { createCommands } from '../input/commands';
import { PaletteList } from './PaletteList';
import type { PaletteItem } from './PaletteList';
import type { CommandContext } from '../types';

export function CommandPalette() {
  const nodeStore = useNodeStore();
  const uiStore = useUIStore();
  const { isCommandPaletteOpen, closeCommandPalette } = uiStore;

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSelectedNodeRoot, setIsSelectedNodeRoot] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands = useMemo(() => createCommands(), []);

  useEffect(() => {
    const checkIsRoot = async () => {
      if (nodeStore.selectedNodeId) {
        const isRoot = await nodeStore.isRootNode(nodeStore.selectedNodeId);
        setIsSelectedNodeRoot(isRoot);
      } else {
        setIsSelectedNodeRoot(false);
      }
    };
    checkIsRoot();
  }, [nodeStore.selectedNodeId, nodeStore]);

  const selectedNode = nodeStore.nodes.find((n) => n.id === nodeStore.selectedNodeId);

  const ctx: CommandContext = useMemo(
    () => ({
      selectedNodeId: nodeStore.selectedNodeId,
      selectedNodeContent: selectedNode?.content ?? null,
      mode: uiStore.mode,
      hasNodes: nodeStore.nodes.length > 0,
      isSelectedNodeRoot,
      selectNode: nodeStore.selectNode,
      createRootNode: async () => {
        await nodeStore.createRootNode();
        uiStore.enterInsertMode();
      },
      createChildNode: (parentId) => {
        nodeStore.createChildNode(parentId);
        uiStore.enterInsertMode();
      },
      createSiblingAbove: (siblingId) => {
        nodeStore.createSiblingAbove(siblingId);
        uiStore.enterInsertMode();
      },
      createSiblingBelow: (siblingId) => {
        nodeStore.createSiblingBelow(siblingId);
        uiStore.enterInsertMode();
      },
      insertBetweenParentAndChild: (childId) => {
        nodeStore.insertBetweenParentAndChild(childId);
        uiStore.enterInsertMode();
      },
      updateNodeContent: nodeStore.updateNodeContent,
      deleteNode: async (id) => {
        const result = await nodeStore.deleteNode(id);
        if (!result.ok && result.error) {
          uiStore.setError(result.error);
        }
      },
      deleteNodeWithChildren: nodeStore.deleteNodeWithChildren,
      deleteChildren: nodeStore.deleteChildren,
      enterInsertMode: uiStore.enterInsertMode,
      exitInsertMode: uiStore.exitInsertMode,
      navigateToParent: async () => {
        const { service, selectedNodeId } = useNodeStore.getState();
        if (!service || !selectedNodeId) return;
        const parentId = await service.getParentId(selectedNodeId);
        if (parentId) nodeStore.selectNode(parentId);
      },
      navigateToFirstChild: async () => {
        const { service, selectedNodeId } = useNodeStore.getState();
        if (!service || !selectedNodeId) return;
        const childId = await service.getFirstChildId(selectedNodeId);
        if (childId) nodeStore.selectNode(childId);
      },
      navigateToNextSibling: async () => {
        const { service, selectedNodeId } = useNodeStore.getState();
        if (!service || !selectedNodeId) return;
        const siblingId = await service.getNextSiblingId(selectedNodeId);
        if (siblingId) nodeStore.selectNode(siblingId);
      },
      navigateToPreviousSibling: async () => {
        const { service, selectedNodeId } = useNodeStore.getState();
        if (!service || !selectedNodeId) return;
        const siblingId = await service.getPreviousSiblingId(selectedNodeId);
        if (siblingId) nodeStore.selectNode(siblingId);
      },
      openSearch: uiStore.openSearch,
      openCommandPalette: uiStore.openCommandPalette,
      fitToView: () => {
        const { fitToView } = useNodeStore.getState();
        if (fitToView) fitToView();
      },
      focusCurrentNode: () => {
        const { focusNode, selectedNodeId } = useNodeStore.getState();
        if (focusNode && selectedNodeId) focusNode(selectedNodeId);
      },
      copyNodeContent: () => {
        nodeStore.copySelectedNodeContent();
      },
      navigateToRoot: async () => {
        const { service } = useNodeStore.getState();
        if (!service) return;
        const root = await service.getRootNode();
        if (root) nodeStore.selectNode(root.id);
      },
      panCanvas: (direction) => {
        const { panCanvas } = useNodeStore.getState();
        if (panCanvas) panCanvas(direction);
      },
      zoomCanvas: (direction) => {
        const { zoomCanvas } = useNodeStore.getState();
        if (zoomCanvas) zoomCanvas(direction);
      },
      exportAs: (format) => {
        const { exportAs } = useNodeStore.getState();
        if (exportAs) exportAs(format);
      },
    }),
    [nodeStore, uiStore, isSelectedNodeRoot, selectedNode]
  );

  const availableCommands = useMemo(() => {
    return allCommands
      .filter((cmd) => cmd.modes.includes(ctx.mode))
      .filter((cmd) => !cmd.canExecute || cmd.canExecute(ctx))
      .filter(
        (cmd) =>
          !query ||
          cmd.name.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
      );
  }, [allCommands, ctx, query]);

  const items: PaletteItem[] = availableCommands.map((cmd) => ({
    id: cmd.id,
    primary: cmd.name,
    secondary: cmd.description,
    trailing: cmd.keybindings[0],
  }));

  const clampedIndex = Math.min(selectedIndex, Math.max(0, availableCommands.length - 1));

  useEffect(() => {
    if (isCommandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCommandPaletteOpen]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  };

  const handleSelect = (index: number) => {
    const cmd = availableCommands[index];
    if (cmd) {
      cmd.execute(ctx);
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, availableCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        e.preventDefault();
        handleSelect(clampedIndex);
        break;
      }
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  const handleClose = () => {
    setQuery('');
    setSelectedIndex(0);
    closeCommandPalette();
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
        {selectedNode && (
          <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600 truncate">
            <span className="text-gray-400">Node:</span>{' '}
            <span className="font-medium text-gray-700">{selectedNode.content || '(empty)'}</span>
          </div>
        )}
        <div className="px-4 py-3 border-b">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="w-full outline-none"
          />
        </div>
        <PaletteList
          items={items}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          emptyMessage="No commands found"
        />
      </div>
    </div>
  );
}
