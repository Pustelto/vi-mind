import { describe, it, expect, beforeEach } from 'vitest';
import { createMindMapService, MindMapService } from '../../src/services/mindMapService';
import { createInMemoryRepository, Repository } from '../../src/storage/repository';

describe('MindMapService', () => {
  let repository: Repository;
  let service: MindMapService;

  beforeEach(async () => {
    repository = createInMemoryRepository();
    service = createMindMapService(repository);
  });

  describe('createNode', () => {
    it('should create a root node', async () => {
      const node = await service.createNode('Root', null);

      expect(node.content).toBe('Root');
      expect(node.parentId).toBeNull();
      expect(node.id).toBeDefined();
    });

    it('should create a child node', async () => {
      const parent = await service.createNode('Parent', null);
      const child = await service.createNode('Child', parent.id);

      expect(child.content).toBe('Child');
      expect(child.parentId).toBe(parent.id);
    });
  });

  describe('getNode', () => {
    it('should retrieve an existing node', async () => {
      const created = await service.createNode('Test', null);
      const retrieved = await service.getNode(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent node', async () => {
      const result = await service.getNode('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAllNodes', () => {
    it('should return all nodes', async () => {
      await service.createNode('Node 1', null);
      const parent = await service.createNode('Node 2', null);
      await service.createNode('Child', parent.id);

      const all = await service.getAllNodes();
      expect(all).toHaveLength(3);
    });
  });

  describe('getChildren', () => {
    it('should return children of a node', async () => {
      const parent = await service.createNode('Parent', null);
      await service.createNode('Child 1', parent.id);
      await service.createNode('Child 2', parent.id);

      const children = await service.getChildren(parent.id);

      expect(children).toHaveLength(2);
    });

    it('should return empty array for leaf node', async () => {
      const leaf = await service.createNode('Leaf', null);
      const children = await service.getChildren(leaf.id);

      expect(children).toHaveLength(0);
    });
  });

  describe('getParent', () => {
    it('should return parent node', async () => {
      const parent = await service.createNode('Parent', null);
      const child = await service.createNode('Child', parent.id);

      const result = await service.getParent(child.id);

      expect(result).toEqual(parent);
    });

    it('should return null for root node', async () => {
      const root = await service.createNode('Root', null);
      const result = await service.getParent(root.id);

      expect(result).toBeNull();
    });
  });

  describe('getSiblings', () => {
    it('should return sibling nodes', async () => {
      const parent = await service.createNode('Parent', null);
      const child1 = await service.createNode('Child 1', parent.id);
      const child2 = await service.createNode('Child 2', parent.id);
      const child3 = await service.createNode('Child 3', parent.id);

      const siblings = await service.getSiblings(child2.id);

      expect(siblings).toHaveLength(2);
      expect(siblings.map((s) => s.id)).toContain(child1.id);
      expect(siblings.map((s) => s.id)).toContain(child3.id);
      expect(siblings.map((s) => s.id)).not.toContain(child2.id);
    });

    it('should return empty array for only child', async () => {
      const parent = await service.createNode('Parent', null);
      const child = await service.createNode('Child', parent.id);

      const siblings = await service.getSiblings(child.id);

      expect(siblings).toHaveLength(0);
    });
  });

  describe('hasChildren', () => {
    it('should return true when node has children', async () => {
      const parent = await service.createNode('Parent', null);
      await service.createNode('Child', parent.id);

      const result = await service.hasChildren(parent.id);

      expect(result).toBe(true);
    });

    it('should return false when node has no children', async () => {
      const leaf = await service.createNode('Leaf', null);

      const result = await service.hasChildren(leaf.id);

      expect(result).toBe(false);
    });
  });

  describe('updateContent', () => {
    it('should update node content', async () => {
      const node = await service.createNode('Original', null);

      const updated = await service.updateContent(node.id, 'Updated');

      expect(updated.content).toBe('Updated');
      expect(updated.id).toBe(node.id);
    });

    it('should throw for non-existent node', async () => {
      await expect(service.updateContent('non-existent', 'Content')).rejects.toThrow(
        'Node not found'
      );
    });
  });

  describe('deleteNode', () => {
    it('should delete a leaf node', async () => {
      const parent = await service.createNode('Parent', null);
      const child = await service.createNode('Child', parent.id);

      const result = await service.deleteNode(child.id);

      expect(result.ok).toBe(true);
      expect(await service.getNode(child.id)).toBeNull();
    });

    it('should return error when deleting root node', async () => {
      const root = await service.createNode('Root', null);

      const result = await service.deleteNode(root.id);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Cannot delete root node');
      }
    });

    it('should return error when node has children', async () => {
      const parent = await service.createNode('Parent', null);
      const child = await service.createNode('Child', parent.id);
      await service.createNode('Grandchild', child.id);

      const result = await service.deleteNode(child.id);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Node has children');
      }
    });

    it('should return error for non-existent node', async () => {
      const result = await service.deleteNode('non-existent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Node not found');
      }
    });
  });

  describe('deleteNodeWithChildren', () => {
    it('should delete node and all descendants', async () => {
      const root = await service.createNode('Root', null);
      const child1 = await service.createNode('Child 1', root.id);
      const child2 = await service.createNode('Child 2', root.id);
      const grandchild = await service.createNode('Grandchild', child1.id);

      await service.deleteNodeWithChildren(child1.id);

      expect(await service.getNode(child1.id)).toBeNull();
      expect(await service.getNode(grandchild.id)).toBeNull();
      expect(await service.getNode(root.id)).not.toBeNull();
      expect(await service.getNode(child2.id)).not.toBeNull();
    });
  });

  describe('ensureRootExists', () => {
    it('should create root if none exists', async () => {
      const root = await service.ensureRootExists();

      expect(root.content).toBe('Root');
      expect(root.parentId).toBeNull();
    });

    it('should return existing root', async () => {
      const existing = await service.createNode('Existing Root', null);
      const root = await service.ensureRootExists();

      expect(root.id).toBe(existing.id);
      expect(root.content).toBe('Existing Root');
    });
  });

  describe('navigation - getParentId', () => {
    it('should return parent id', async () => {
      const parent = await service.createNode('Parent', null);
      const child = await service.createNode('Child', parent.id);

      const parentId = await service.getParentId(child.id);

      expect(parentId).toBe(parent.id);
    });

    it('should return null for root node', async () => {
      const root = await service.createNode('Root', null);

      const parentId = await service.getParentId(root.id);

      expect(parentId).toBeNull();
    });
  });

  describe('navigation - getFirstChildId', () => {
    it('should return first child id', async () => {
      const parent = await service.createNode('Parent', null);
      const child1 = await service.createNode('Child 1', parent.id);
      await service.createNode('Child 2', parent.id);

      const firstChildId = await service.getFirstChildId(parent.id);

      expect(firstChildId).toBe(child1.id);
    });

    it('should return null when no children', async () => {
      const leaf = await service.createNode('Leaf', null);

      const firstChildId = await service.getFirstChildId(leaf.id);

      expect(firstChildId).toBeNull();
    });
  });

  describe('navigation - getNextSiblingId', () => {
    it('should return next sibling id', async () => {
      const parent = await service.createNode('Parent', null);
      await service.createNode('Child 1', parent.id);
      const child2 = await service.createNode('Child 2', parent.id);
      const child3 = await service.createNode('Child 3', parent.id);

      const nextId = await service.getNextSiblingId(child2.id);

      expect(nextId).toBe(child3.id);
    });

    it('should return null when at last sibling', async () => {
      const parent = await service.createNode('Parent', null);
      await service.createNode('Child 1', parent.id);
      const child2 = await service.createNode('Child 2', parent.id);

      const nextId = await service.getNextSiblingId(child2.id);

      expect(nextId).toBeNull();
    });

    it('should return null for only child', async () => {
      const parent = await service.createNode('Parent', null);
      const child = await service.createNode('Child', parent.id);

      const nextId = await service.getNextSiblingId(child.id);

      expect(nextId).toBeNull();
    });
  });

  describe('navigation - getPreviousSiblingId', () => {
    it('should return previous sibling id', async () => {
      const parent = await service.createNode('Parent', null);
      const child1 = await service.createNode('Child 1', parent.id);
      const child2 = await service.createNode('Child 2', parent.id);
      await service.createNode('Child 3', parent.id);

      const prevId = await service.getPreviousSiblingId(child2.id);

      expect(prevId).toBe(child1.id);
    });

    it('should return null when at first sibling', async () => {
      const parent = await service.createNode('Parent', null);
      const child1 = await service.createNode('Child 1', parent.id);
      await service.createNode('Child 2', parent.id);

      const prevId = await service.getPreviousSiblingId(child1.id);

      expect(prevId).toBeNull();
    });
  });

  describe('insertBetweenParentAndChild', () => {
    it('should insert a node between parent and child', async () => {
      const root = await service.createNode('Root', null);
      const child = await service.createNode('Child', root.id);

      const inserted = await service.insertBetweenParentAndChild(child.id, 'Middle');

      expect(inserted).not.toBeNull();
      expect(inserted!.content).toBe('Middle');
      expect(inserted!.parentId).toBe(root.id);

      const updatedChild = await service.getNode(child.id);
      expect(updatedChild!.parentId).toBe(inserted!.id);
    });

    it('should return null when trying to insert on root node', async () => {
      const root = await service.createNode('Root', null);

      const result = await service.insertBetweenParentAndChild(root.id, 'Middle');

      expect(result).toBeNull();
    });

    it('should preserve the position among siblings', async () => {
      const root = await service.createNode('Root', null);
      await service.createNode('Child 1', root.id);
      const child2 = await service.createNode('Child 2', root.id);
      await service.createNode('Child 3', root.id);

      const originalOrder = child2.order;
      const inserted = await service.insertBetweenParentAndChild(child2.id, 'Middle');

      expect(inserted!.order).toBe(originalOrder);

      const updatedChild2 = await service.getNode(child2.id);
      expect(updatedChild2!.order).toBe(0);
    });
  });
});
