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
      fitToView: null,
    });
  });

  describe('initialize', () => {
    it('should initialize with empty nodes', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);

      await useNodeStore.getState().initialize(service);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(0);
      expect(state.selectedNodeId).toBeNull();
      expect(state.service).toBe(service);
    });

    it('should load existing nodes', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await service.createNode('Root', null);

      await useNodeStore.getState().initialize(service);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.selectedNodeId).toBe(state.nodes[0].id);
    });
  });

  describe('createRootNode', () => {
    it('should create root node when empty', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);

      const root = await useNodeStore.getState().createRootNode();

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.selectedNodeId).toBe(root?.id);
    });
  });

  describe('selectNode', () => {
    it('should update selectedNodeId', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);
      const root = await useNodeStore.getState().createRootNode();

      const child = await service.createNode('Child', root!.id);
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
      const root = await useNodeStore.getState().createRootNode();

      const child = await useNodeStore.getState().createChildNode(root!.id);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(2);
      expect(state.selectedNodeId).toBe(child.id);
    });
  });

  describe('createSiblingBelow', () => {
    it('should create sibling below and select it', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);
      const root = await useNodeStore.getState().createRootNode();

      const child = await useNodeStore.getState().createChildNode(root!.id);
      const sibling = await useNodeStore.getState().createSiblingBelow(child.id);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(3);
      expect(state.selectedNodeId).toBe(sibling?.id);
    });

    it('should return null when creating sibling on root', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);
      const root = await useNodeStore.getState().createRootNode();

      const sibling = await useNodeStore.getState().createSiblingBelow(root!.id);

      expect(sibling).toBeNull();
    });
  });

  describe('updateNodeContent', () => {
    it('should update node content', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);
      const root = await useNodeStore.getState().createRootNode();

      await useNodeStore.getState().updateNodeContent(root!.id, 'Updated Content');

      const node = useNodeStore.getState().nodes.find((n) => n.id === root!.id);
      expect(node?.content).toBe('Updated Content');
    });
  });

  describe('deleteNode', () => {
    it('should delete node and select sibling', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);
      const root = await useNodeStore.getState().createRootNode();

      const child1 = await useNodeStore.getState().createChildNode(root!.id);
      const child2 = await useNodeStore.getState().createChildNode(root!.id);

      useNodeStore.getState().selectNode(child2.id);
      const result = await useNodeStore.getState().deleteNode(child2.id);

      expect(result.ok).toBe(true);
      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(2);
      expect(state.selectedNodeId).toBe(child1.id);
    });

    it('should allow deleting root and clear selection', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);
      const root = await useNodeStore.getState().createRootNode();

      const result = await useNodeStore.getState().deleteNode(root!.id);

      expect(result.ok).toBe(true);
      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(0);
      expect(state.selectedNodeId).toBeNull();
    });
  });

  describe('deleteNodeWithChildren', () => {
    it('should delete node and all children', async () => {
      const repository = createInMemoryRepository();
      const service = createMindMapService(repository);
      await useNodeStore.getState().initialize(service);
      const root = await useNodeStore.getState().createRootNode();

      const child = await useNodeStore.getState().createChildNode(root!.id);
      await useNodeStore.getState().createChildNode(child.id);

      await useNodeStore.getState().deleteNodeWithChildren(child.id);

      const state = useNodeStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.selectedNodeId).toBe(root!.id);
    });
  });
});
