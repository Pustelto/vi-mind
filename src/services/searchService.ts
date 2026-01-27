import Fuse from 'fuse.js';
import type { MindMapNode, NodeId } from '../types';

export interface SearchResult {
  nodeId: NodeId;
  content: string;
  score: number;
  matches: Array<{ indices: [number, number][] }>;
}

export interface SearchService {
  search(query: string): SearchResult[];
  updateNodes(nodes: MindMapNode[]): void;
}

export function createSearchService(initialNodes: MindMapNode[] = []): SearchService {
  let fuse = new Fuse(initialNodes, {
    keys: ['content'],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    includeMatches: true,
  });

  return {
    search: (query: string): SearchResult[] => {
      if (!query.trim()) return [];

      return fuse.search(query).map((result) => ({
        nodeId: result.item.id,
        content: result.item.content,
        score: result.score ?? 0,
        matches:
          result.matches?.map((m) => ({ indices: m.indices as [number, number][] })) ?? [],
      }));
    },

    updateNodes: (nodes: MindMapNode[]): void => {
      fuse = new Fuse(nodes, {
        keys: ['content'],
        threshold: 0.4,
        distance: 100,
        includeScore: true,
        includeMatches: true,
      });
    },
  };
}
