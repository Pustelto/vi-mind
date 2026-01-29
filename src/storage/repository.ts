import type { MindMapNode, NodeId } from '../types';

export interface Repository {
  save(node: MindMapNode): Promise<void>;
  findById(id: NodeId): Promise<MindMapNode | null>;
  findByParentId(parentId: NodeId | null): Promise<MindMapNode[]>;
  findAll(): Promise<MindMapNode[]>;
  delete(id: NodeId): Promise<void>;
  clear(): Promise<void>;
}

export function createInMemoryRepository(): Repository {
  const nodes = new Map<NodeId, MindMapNode>();

  return {
    save: async (node) => {
      nodes.set(node.id, node);
    },
    findById: async (id) => nodes.get(id) ?? null,
    findByParentId: async (parentId) =>
      Array.from(nodes.values())
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => a.order - b.order),
    findAll: async () => Array.from(nodes.values()),
    delete: async (id) => {
      nodes.delete(id);
    },
    clear: async () => {
      nodes.clear();
    },
  };
}

const STORAGE_KEY = 'mindmap-nodes';

export function createLocalStorageRepository(): Repository {
  const nodes = new Map<NodeId, MindMapNode>();

  const loadFromStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: MindMapNode[] = JSON.parse(stored);
      nodes.clear();
      parsed.forEach((node) => nodes.set(node.id, node));
    }
  };

  const saveToStorage = () => {
    const data = Array.from(nodes.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  loadFromStorage();

  return {
    save: async (node) => {
      nodes.set(node.id, node);
      saveToStorage();
    },
    findById: async (id) => nodes.get(id) ?? null,
    findByParentId: async (parentId) =>
      Array.from(nodes.values())
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => a.order - b.order),
    findAll: async () => Array.from(nodes.values()),
    delete: async (id) => {
      nodes.delete(id);
      saveToStorage();
    },
    clear: async () => {
      nodes.clear();
      saveToStorage();
    },
  };
}
