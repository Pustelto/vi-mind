import { useEffect, useMemo } from 'react';
import { useNodeStore, useUIStore } from '../../stores';
import { createKeyHandler } from '../../input/keyHandler';
import { createCommands } from '../../input/commands';
import type { CommandContext } from '../../types';

export function useKeyboardShortcuts() {
  const nodeStore = useNodeStore();
  const uiStore = useUIStore();

  const keyHandler = useMemo(() => {
    const commands = createCommands();
    return createKeyHandler(commands);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const ctx: CommandContext = {
        selectedNodeId: nodeStore.selectedNodeId,
        mode: uiStore.mode,
        selectNode: nodeStore.selectNode,
        createChildNode: (parentId) => {
          nodeStore.createChildNode(parentId);
          uiStore.enterInsertMode();
        },
        createSiblingNode: (siblingId) => {
          nodeStore.createSiblingNode(siblingId);
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
      };

      const handled = keyHandler.handleKeyDown(event, ctx);
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyHandler, nodeStore, uiStore]);

  return keyHandler;
}
