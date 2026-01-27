import { create } from 'zustand';
import type { MindMapNode, NodeId } from '../types';
import type { MindMapService } from '../services/mindMapService';

interface NodeState {
  nodes: MindMapNode[];
  selectedNodeId: NodeId | null;
  service: MindMapService | null;

  initialize: (service: MindMapService) => Promise<void>;
  selectNode: (id: NodeId) => void;
  refreshNodes: () => Promise<void>;
  createChildNode: (parentId: NodeId) => Promise<MindMapNode>;
  createSiblingNode: (siblingId: NodeId) => Promise<MindMapNode | null>;
  updateNodeContent: (id: NodeId, content: string) => Promise<void>;
  deleteNode: (id: NodeId) => Promise<{ ok: boolean; error?: string }>;
  deleteNodeWithChildren: (id: NodeId) => Promise<void>;
}

export const useNodeStore = create<NodeState>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  service: null,

  initialize: async (service) => {
    const root = await service.ensureRootExists();
    const nodes = await service.getAllNodes();
    set({ service, nodes, selectedNodeId: root.id });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  refreshNodes: async () => {
    const { service } = get();
    if (!service) return;
    const nodes = await service.getAllNodes();
    set({ nodes });
  },

  createChildNode: async (parentId) => {
    const { service, refreshNodes } = get();
    if (!service) throw new Error('Service not initialized');
    const node = await service.createNode('New Node', parentId);
    await refreshNodes();
    set({ selectedNodeId: node.id });
    return node;
  },

  createSiblingNode: async (siblingId) => {
    const { service, refreshNodes } = get();
    if (!service) return null;
    const sibling = await service.getNode(siblingId);
    if (!sibling) return null;
    const node = await service.createNode('New Node', sibling.parentId);
    await refreshNodes();
    set({ selectedNodeId: node.id });
    return node;
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
}));
