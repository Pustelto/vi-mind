import { create } from 'zustand';
import type { MindMapNode, NodeId } from '../types';
import type { MindMapService } from '../services/mindMapService';

interface NodeState {
  nodes: MindMapNode[];
  selectedNodeId: NodeId | null;
  service: MindMapService | null;
  fitToView: (() => void) | null;

  initialize: (service: MindMapService) => Promise<void>;
  selectNode: (id: NodeId) => void;
  refreshNodes: () => Promise<void>;
  createRootNode: () => Promise<MindMapNode | null>;
  createChildNode: (parentId: NodeId) => Promise<MindMapNode>;
  createSiblingAbove: (siblingId: NodeId) => Promise<MindMapNode | null>;
  createSiblingBelow: (siblingId: NodeId) => Promise<MindMapNode | null>;
  isRootNode: (nodeId: NodeId) => Promise<boolean>;
  updateNodeContent: (id: NodeId, content: string) => Promise<void>;
  deleteNode: (id: NodeId) => Promise<{ ok: boolean; error?: string }>;
  deleteNodeWithChildren: (id: NodeId) => Promise<void>;
  setFitToView: (fn: () => void) => void;
}

export const useNodeStore = create<NodeState>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  service: null,
  fitToView: null,

  initialize: async (service) => {
    const nodes = await service.getAllNodes();
    const root = nodes.find((n) => n.parentId === null);
    set({ service, nodes, selectedNodeId: root?.id ?? null });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  refreshNodes: async () => {
    const { service } = get();
    if (!service) return;
    const nodes = await service.getAllNodes();
    set({ nodes });
  },

  createRootNode: async () => {
    const { service, refreshNodes, nodes } = get();
    if (!service) return null;
    if (nodes.some((n) => n.parentId === null)) return null;
    const node = await service.createNode('Root', null);
    await refreshNodes();
    set({ selectedNodeId: node.id });
    return node;
  },

  createChildNode: async (parentId) => {
    const { service, refreshNodes } = get();
    if (!service) throw new Error('Service not initialized');
    const node = await service.createNode('New Node', parentId);
    await refreshNodes();
    set({ selectedNodeId: node.id });
    return node;
  },

  createSiblingAbove: async (siblingId) => {
    const { service, refreshNodes } = get();
    if (!service) return null;
    const node = await service.createSiblingAbove(siblingId, 'New Node');
    if (!node) return null;
    await refreshNodes();
    set({ selectedNodeId: node.id });
    return node;
  },

  createSiblingBelow: async (siblingId) => {
    const { service, refreshNodes } = get();
    if (!service) return null;
    const node = await service.createSiblingBelow(siblingId, 'New Node');
    if (!node) return null;
    await refreshNodes();
    set({ selectedNodeId: node.id });
    return node;
  },

  isRootNode: async (nodeId) => {
    const { service } = get();
    if (!service) return false;
    return service.isRootNode(nodeId);
  },

  updateNodeContent: async (id, content) => {
    const { service, refreshNodes } = get();
    if (!service) return;
    await service.updateContent(id, content);
    await refreshNodes();
  },

  deleteNode: async (id) => {
    const { service, refreshNodes } = get();
    if (!service) return { ok: false, error: 'Service not initialized' };
    const parent = await service.getParent(id);
    const siblings = await service.getSiblings(id);
    const result = await service.deleteNode(id);
    if (!result.ok) return result;
    await refreshNodes();
    set({ selectedNodeId: siblings[0]?.id ?? parent?.id ?? null });
    return { ok: true };
  },

  deleteNodeWithChildren: async (id) => {
    const { service, refreshNodes } = get();
    if (!service) return;
    const parent = await service.getParent(id);
    const siblings = await service.getSiblings(id);
    await service.deleteNodeWithChildren(id);
    await refreshNodes();
    set({ selectedNodeId: siblings[0]?.id ?? parent?.id ?? null });
  },

  setFitToView: (fn) => set({ fitToView: fn }),
}));
