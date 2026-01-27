import { describe, it, expect } from 'vitest';
import { calculateLayout } from '../../src/layout/hierarchicalLayout';
import type { MindMapNode } from '../../src/types';

describe('calculateLayout', () => {
  describe('empty input', () => {
    it('should return empty result for empty nodes array', () => {
      const result = calculateLayout([]);

      expect(result.nodes.size).toBe(0);
      expect(result.edges).toHaveLength(0);
      expect(result.bounds.width).toBe(0);
      expect(result.bounds.height).toBe(0);
    });
  });

  describe('single node', () => {
    it('should position single node at origin (with padding)', () => {
      const nodes: MindMapNode[] = [{ id: 'root', content: 'Root', parentId: null }];

      const result = calculateLayout(nodes);

      expect(result.nodes.size).toBe(1);
      const rootLayout = result.nodes.get('root');
      expect(rootLayout).toBeDefined();
      expect(rootLayout?.position.x).toBe(50);
      expect(rootLayout?.position.y).toBe(50);
    });

    it('should have no edges for single node', () => {
      const nodes: MindMapNode[] = [{ id: 'root', content: 'Root', parentId: null }];

      const result = calculateLayout(nodes);

      expect(result.edges).toHaveLength(0);
    });
  });

  describe('parent with one child', () => {
    it('should position child to the right of parent', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child', content: 'Child', parentId: 'root' },
      ];

      const result = calculateLayout(nodes);

      const rootLayout = result.nodes.get('root');
      const childLayout = result.nodes.get('child');

      expect(childLayout?.position.x).toBeGreaterThan(rootLayout?.position.x ?? 0);
    });

    it('should create edge between parent and child', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child', content: 'Child', parentId: 'root' },
      ];

      const result = calculateLayout(nodes);

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].fromId).toBe('root');
      expect(result.edges[0].toId).toBe('child');
    });
  });

  describe('parent with multiple children', () => {
    it('should distribute children vertically', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child1', content: 'Child 1', parentId: 'root' },
        { id: 'child2', content: 'Child 2', parentId: 'root' },
        { id: 'child3', content: 'Child 3', parentId: 'root' },
      ];

      const result = calculateLayout(nodes);

      const child1 = result.nodes.get('child1');
      const child2 = result.nodes.get('child2');
      const child3 = result.nodes.get('child3');

      expect(child1?.position.y).toBeLessThan(child2?.position.y ?? 0);
      expect(child2?.position.y).toBeLessThan(child3?.position.y ?? 0);
    });

    it('should create edge for each child', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child1', content: 'Child 1', parentId: 'root' },
        { id: 'child2', content: 'Child 2', parentId: 'root' },
      ];

      const result = calculateLayout(nodes);

      expect(result.edges).toHaveLength(2);
    });
  });

  describe('deep tree', () => {
    it('should not have overlapping nodes', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child1', content: 'Child 1', parentId: 'root' },
        { id: 'child2', content: 'Child 2', parentId: 'root' },
        { id: 'grandchild1', content: 'Grandchild 1', parentId: 'child1' },
        { id: 'grandchild2', content: 'Grandchild 2', parentId: 'child1' },
        { id: 'grandchild3', content: 'Grandchild 3', parentId: 'child2' },
      ];

      const result = calculateLayout(nodes);

      const layouts = Array.from(result.nodes.values());

      for (let i = 0; i < layouts.length; i++) {
        for (let j = i + 1; j < layouts.length; j++) {
          const a = layouts[i];
          const b = layouts[j];

          const overlapX =
            a.position.x < b.position.x + b.width && a.position.x + a.width > b.position.x;
          const overlapY =
            a.position.y < b.position.y + b.height && a.position.y + a.height > b.position.y;

          expect(overlapX && overlapY).toBe(false);
        }
      }
    });

    it('should position grandchildren further right', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child', content: 'Child', parentId: 'root' },
        { id: 'grandchild', content: 'Grandchild', parentId: 'child' },
      ];

      const result = calculateLayout(nodes);

      const root = result.nodes.get('root');
      const child = result.nodes.get('child');
      const grandchild = result.nodes.get('grandchild');

      expect(child?.position.x).toBeGreaterThan(root?.position.x ?? 0);
      expect(grandchild?.position.x).toBeGreaterThan(child?.position.x ?? 0);
    });
  });

  describe('bounds calculation', () => {
    it('should calculate correct bounds', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child', content: 'Child', parentId: 'root' },
      ];

      const result = calculateLayout(nodes);

      expect(result.bounds.width).toBeGreaterThan(0);
      expect(result.bounds.height).toBeGreaterThan(0);
    });

    it('should include all nodes in bounds', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child1', content: 'Child 1', parentId: 'root' },
        { id: 'child2', content: 'Child 2', parentId: 'root' },
      ];

      const result = calculateLayout(nodes);

      for (const layout of result.nodes.values()) {
        expect(layout.position.x + layout.width).toBeLessThanOrEqual(result.bounds.width);
        expect(layout.position.y + layout.height).toBeLessThanOrEqual(result.bounds.height);
      }
    });
  });

  describe('edge points', () => {
    it('should have start point at parent right edge', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child', content: 'Child', parentId: 'root' },
      ];

      const result = calculateLayout(nodes);
      const edge = result.edges[0];
      const rootLayout = result.nodes.get('root');

      expect(edge.points[0].x).toBe(rootLayout!.position.x + rootLayout!.width);
    });

    it('should have end point at child left edge', () => {
      const nodes: MindMapNode[] = [
        { id: 'root', content: 'Root', parentId: null },
        { id: 'child', content: 'Child', parentId: 'root' },
      ];

      const result = calculateLayout(nodes);
      const edge = result.edges[0];
      const childLayout = result.nodes.get('child');

      expect(edge.points[1].x).toBe(childLayout!.position.x);
    });
  });
});
