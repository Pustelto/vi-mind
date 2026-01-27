import { describe, it, expect, beforeEach } from 'vitest';
import { useNodeStore } from '../../src/stores/nodeStore';
import { createInMemoryRepository } from '../../src/storage/repository';
import { createMindMapService } from '../../src/services/mindMapService';

describe('nodeStore', () => {
  beforeEach(() => {
    useNodeStore.setState({
      nodes: [],
      selectedNodeId: null,
      service: null,
    });
  });

  describe('initialize', () => {
    it('should initialize with root node', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);

      await useNodeStore.getState().initialize(service);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.selectedNodeId).toBe(state.nodes[0].id);
      expect(state.service).toBe(service);
    });
  });

  describe('selectNode', () => {
    it('should update selectedNodeId', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);

      const child = await service.createNode('Child', useNodeStore.getState().nodes[0].id);
      await useNodeStore.getState().refreshNodes();

      useNodeStore.getState().selectNode(child.id);

      expect(useNodeStore.getState().selectedNodeId).toBe(child.id);
    });
  });

  describe('createChildNode', () => {
    it('should create child and select it', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);

      const rootId = useNodeStore.getState().nodes[0].id;
      const child = await useNodeStore.getState().createChildNode(rootId);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(2);
      expect(state.selectedNodeId).toBe(child.id);
    });
  });

  describe('createSiblingNode', () => {
    it('should create sibling and select it', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);

      const rootId = useNodeStore.getState().nodes[0].id;
      const child = await useNodeStore.getState().createChildNode(rootId);
      const sibling = await useNodeStore.getState().createSiblingNode(child.id);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(3);
      expect(state.selectedNodeId).toBe(sibling?.id);
    });
  });

  describe('updateNodeContent', () => {
    it('should update node content', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);

      const rootId = useNodeStore.getState().nodes[0].id;
      await useNodeStore.getState().updateNodeContent(rootId, 'Updated Content');

      const node = useNodeStore.getState().nodes.find((n) => n.id === rootId);
      expect(node?.content).toBe('Updated Content');
    });
  });

  describe('deleteNode', () => {
    it('should delete node and select sibling', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);

      const rootId = useNodeStore.getState().nodes[0].id;
      const child1 = await useNodeStore.getState().createChildNode(rootId);
      const child2 = await useNodeStore.getState().createChildNode(rootId);

      useNodeStore.getState().selectNode(child2.id);
      const result = await useNodeStore.getState().deleteNode(child2.id);

      expect(result.ok).toBe(true);
      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(2);
      expect(state.selectedNodeId).toBe(child1.id);
    });

    it('should return error when deleting root', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);

      const rootId = useNodeStore.getState().nodes[0].id;
      const result = await useNodeStore.getState().deleteNode(rootId);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Cannot delete root node');
    });
  });

  describe('deleteNodeWithChildren', () => {
    it('should delete node and all children', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);

      const rootId = useNodeStore.getState().nodes[0].id;
      const child = await useNodeStore.getState().createChildNode(rootId);
      await useNodeStore.getState().createChildNode(child.id);

      await useNodeStore.getState().deleteNodeWithChildren(child.id);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.selectedNodeId).toBe(rootId);
    });
  });
});
