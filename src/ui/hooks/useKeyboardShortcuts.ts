import { useEffect, useMemo, useState } from 'react';
import { useNodeStore, useUIStore } from '../../stores';
import { createKeyHandler } from '../../input/keyHandler';
import { createCommands } from '../../input/commands';
import type { CommandContext } from '../../types';

export function useKeyboardShortcuts() {
  const nodeStore = useNodeStore();
  const uiStore = useUIStore();
  const [isSelectedNodeRoot, setIsSelectedNodeRoot] = useState(false);

  const keyHandler = useMemo(() => {
    const commands = createCommands();
    return createKeyHandler(commands);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const selectedNode = nodeStore.nodes.find((n) => n.id === nodeStore.selectedNodeId);
      const ctx: CommandContext = {
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
        navigateToRoot: async () => {
          const { service } = useNodeStore.getState();
          if (!service) return;
          const root = await service.getRootNode();
          if (root) nodeStore.selectNode(root.id);
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
      };

      const handled = keyHandler.handleKeyDown(event, ctx);
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyHandler, nodeStore, uiStore, isSelectedNodeRoot]);

  return keyHandler;
}
