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
