import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryRepository, Repository } from '../../src/storage/repository';
import type { MindMapNode } from '../../src/types';

describe('InMemoryRepository', () => {
  let repository: Repository;

  beforeEach(() => {
    repository = createInMemoryRepository();
  });

  describe('save and findById', () => {
    it('should save and retrieve a node', async () => {
      const node: MindMapNode = { id: '1', content: 'Test', parentId: null };

      await repository.save(node);
      const result = await repository.findById('1');

      expect(result).toEqual(node);
    });

    it('should return null for non-existent node', async () => {
      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should update existing node on save', async () => {
      const node: MindMapNode = { id: '1', content: 'Original', parentId: null };
      await repository.save(node);

      const updated: MindMapNode = { id: '1', content: 'Updated', parentId: null };
      await repository.save(updated);

      const result = await repository.findById('1');
      expect(result?.content).toBe('Updated');
    });
  });

  describe('findByParentId', () => {
    it('should find children of a parent', async () => {
      const parent: MindMapNode = { id: 'parent', content: 'Parent', parentId: null };
      const child1: MindMapNode = { id: 'child1', content: 'Child 1', parentId: 'parent' };
      const child2: MindMapNode = { id: 'child2', content: 'Child 2', parentId: 'parent' };

      await repository.save(parent);
      await repository.save(child1);
      await repository.save(child2);

      const children = await repository.findByParentId('parent');

      expect(children).toHaveLength(2);
      expect(children.map((c) => c.id)).toContain('child1');
      expect(children.map((c) => c.id)).toContain('child2');
    });

    it('should find root nodes with parentId null', async () => {
      const root: MindMapNode = { id: 'root', content: 'Root', parentId: null };
      const child: MindMapNode = { id: 'child', content: 'Child', parentId: 'root' };

      await repository.save(root);
      await repository.save(child);

      const roots = await repository.findByParentId(null);

      expect(roots).toHaveLength(1);
      expect(roots[0].id).toBe('root');
    });

    it('should return empty array when no children exist', async () => {
      const parent: MindMapNode = { id: 'parent', content: 'Parent', parentId: null };
      await repository.save(parent);

      const children = await repository.findByParentId('parent');
      expect(children).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return all nodes', async () => {
      const node1: MindMapNode = { id: '1', content: 'Node 1', parentId: null };
      const node2: MindMapNode = { id: '2', content: 'Node 2', parentId: '1' };

      await repository.save(node1);
      await repository.save(node2);

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
    });

    it('should return empty array when repository is empty', async () => {
      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete a node', async () => {
      const node: MindMapNode = { id: '1', content: 'Test', parentId: null };
      await repository.save(node);

      await repository.delete('1');

      const result = await repository.findById('1');
      expect(result).toBeNull();
    });

    it('should not throw when deleting non-existent node', async () => {
      await expect(repository.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all nodes', async () => {
      const node1: MindMapNode = { id: '1', content: 'Node 1', parentId: null };
      const node2: MindMapNode = { id: '2', content: 'Node 2', parentId: '1' };

      await repository.save(node1);
      await repository.save(node2);
      await repository.clear();

      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });
  });
});
