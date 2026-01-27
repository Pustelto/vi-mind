import { describe, it, expect, beforeEach } from 'vitest';
import { createSearchService, SearchService } from '../../src/services/searchService';
import type { MindMapNode } from '../../src/types';

describe('SearchService', () => {
  let service: SearchService;
  const testNodes: MindMapNode[] = [
    { id: '1', content: 'JavaScript', parentId: null },
    { id: '2', content: 'TypeScript', parentId: '1' },
    { id: '3', content: 'React', parentId: '1' },
    { id: '4', content: 'Vue', parentId: '1' },
    { id: '5', content: 'Angular', parentId: '1' },
  ];

  beforeEach(() => {
    service = createSearchService(testNodes);
  });

  describe('search', () => {
    it('should return exact match', () => {
      const results = service.search('React');

      expect(results).toHaveLength(1);
      expect(results[0].nodeId).toBe('3');
      expect(results[0].content).toBe('React');
    });

    it('should return fuzzy match', () => {
      const results = service.search('Type');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.content === 'TypeScript')).toBe(true);
    });

    it('should return multiple matches', () => {
      const results = service.search('Script');

      expect(results.length).toBeGreaterThanOrEqual(2);
      const contents = results.map((r) => r.content);
      expect(contents).toContain('JavaScript');
      expect(contents).toContain('TypeScript');
    });

    it('should return results sorted by score (best match first)', () => {
      const results = service.search('JavaScript');

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].score).toBeLessThanOrEqual(results[i + 1].score);
        }
      }
    });

    it('should include match indices', () => {
      const results = service.search('React');

      expect(results[0].matches).toBeDefined();
      expect(results[0].matches.length).toBeGreaterThan(0);
      expect(results[0].matches[0].indices).toBeDefined();
    });

    it('should include score', () => {
      const results = service.search('React');

      expect(typeof results[0].score).toBe('number');
    });

    it('should return empty array for empty query', () => {
      const results = service.search('');
      expect(results).toHaveLength(0);
    });

    it('should return empty array for whitespace query', () => {
      const results = service.search('   ');
      expect(results).toHaveLength(0);
    });

    it('should return empty array when no matches found', () => {
      const results = service.search('xyz123nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('updateNodes', () => {
    it('should update search index with new nodes', () => {
      const newNodes: MindMapNode[] = [
        { id: '10', content: 'Python', parentId: null },
        { id: '11', content: 'Django', parentId: '10' },
      ];

      service.updateNodes(newNodes);
      const results = service.search('Python');

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Python');
    });

    it('should no longer find old nodes after update', () => {
      const newNodes: MindMapNode[] = [{ id: '10', content: 'Python', parentId: null }];

      service.updateNodes(newNodes);
      const results = service.search('React');

      expect(results).toHaveLength(0);
    });
  });

  describe('initialization', () => {
    it('should work with empty initial nodes', () => {
      const emptyService = createSearchService();
      const results = emptyService.search('test');

      expect(results).toHaveLength(0);
    });

    it('should work with initial nodes', () => {
      const results = service.search('Vue');

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Vue');
    });
  });
});
