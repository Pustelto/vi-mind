import type { MindMapNode, NodeId, Result } from '../types';
import type { Repository } from '../storage/repository';

export interface MindMapService {
  getAllNodes(): Promise<MindMapNode[]>;
  getNode(id: NodeId): Promise<MindMapNode | null>;
  getRootNode(): Promise<MindMapNode | null>;
  getChildren(parentId: NodeId): Promise<MindMapNode[]>;
  getParent(nodeId: NodeId): Promise<MindMapNode | null>;
  getSiblings(nodeId: NodeId): Promise<MindMapNode[]>;
  hasChildren(nodeId: NodeId): Promise<boolean>;
  isRootNode(nodeId: NodeId): Promise<boolean>;

  getParentId(nodeId: NodeId): Promise<NodeId | null>;
  getFirstChildId(nodeId: NodeId): Promise<NodeId | null>;
  getNextSiblingId(nodeId: NodeId): Promise<NodeId | null>;
  getPreviousSiblingId(nodeId: NodeId): Promise<NodeId | null>;

  createNode(content: string, parentId: NodeId | null): Promise<MindMapNode>;
  createSiblingAbove(siblingId: NodeId, content: string): Promise<MindMapNode | null>;
  createSiblingBelow(siblingId: NodeId, content: string): Promise<MindMapNode | null>;
  insertBetweenParentAndChild(childId: NodeId, content: string): Promise<MindMapNode | null>;
  updateContent(nodeId: NodeId, content: string): Promise<MindMapNode>;
  deleteNode(nodeId: NodeId): Promise<Result<void, string>>;
  deleteNodeWithChildren(nodeId: NodeId): Promise<void>;
  deleteChildren(nodeId: NodeId): Promise<void>;

  ensureRootExists(): Promise<MindMapNode>;
}

export function createMindMapService(repository: Repository): MindMapService {
  const generateId = (): NodeId => crypto.randomUUID();

  const getAllNodes = () => repository.findAll();

  const getNode = (id: NodeId) => repository.findById(id);

  const getRootNode = async (): Promise<MindMapNode | null> => {
    const all = await getAllNodes();
    return all.find((n) => n.parentId === null) ?? null;
  };

  const getChildren = (parentId: NodeId) => repository.findByParentId(parentId);

  const getParent = async (nodeId: NodeId): Promise<MindMapNode | null> => {
    const node = await repository.findById(nodeId);
    if (!node?.parentId) return null;
    return repository.findById(node.parentId);
  };

  const getSiblings = async (nodeId: NodeId): Promise<MindMapNode[]> => {
    const node = await repository.findById(nodeId);
    if (!node) return [];
    const siblings = await repository.findByParentId(node.parentId);
    return siblings.filter((n) => n.id !== nodeId);
  };

  const hasChildren = async (nodeId: NodeId): Promise<boolean> => {
    const children = await repository.findByParentId(nodeId);
    return children.length > 0;
  };

  const isRootNode = async (nodeId: NodeId): Promise<boolean> => {
    const node = await repository.findById(nodeId);
    return node?.parentId === null;
  };

  const createNode = async (content: string, parentId: NodeId | null): Promise<MindMapNode> => {
    const siblings = await repository.findByParentId(parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order)) : -1;
    const node: MindMapNode = { id: generateId(), content, parentId, order: maxOrder + 1 };
    await repository.save(node);
    return node;
  };

  const createSiblingAbove = async (siblingId: NodeId, content: string): Promise<MindMapNode | null> => {
    const sibling = await repository.findById(siblingId);
    if (!sibling || sibling.parentId === null) return null;

    const siblings = await repository.findByParentId(sibling.parentId);
    const siblingIndex = siblings.findIndex((s) => s.id === siblingId);

    for (let i = siblingIndex; i < siblings.length; i++) {
      siblings[i].order += 1;
      await repository.save(siblings[i]);
    }

    const node: MindMapNode = {
      id: generateId(),
      content,
      parentId: sibling.parentId,
      order: sibling.order - 1,
    };
    await repository.save(node);
    return node;
  };

  const createSiblingBelow = async (siblingId: NodeId, content: string): Promise<MindMapNode | null> => {
    const sibling = await repository.findById(siblingId);
    if (!sibling || sibling.parentId === null) return null;

    const siblings = await repository.findByParentId(sibling.parentId);
    const siblingIndex = siblings.findIndex((s) => s.id === siblingId);

    for (let i = siblingIndex + 1; i < siblings.length; i++) {
      siblings[i].order += 1;
      await repository.save(siblings[i]);
    }

    const node: MindMapNode = {
      id: generateId(),
      content,
      parentId: sibling.parentId,
      order: sibling.order + 1,
    };
    await repository.save(node);
    return node;
  };

  const insertBetweenParentAndChild = async (
    childId: NodeId,
    content: string
  ): Promise<MindMapNode | null> => {
    const child = await repository.findById(childId);
    if (!child || child.parentId === null) return null;

    const newNode: MindMapNode = {
      id: generateId(),
      content,
      parentId: child.parentId,
      order: child.order,
    };

    child.parentId = newNode.id;
    child.order = 0;

    await repository.save(newNode);
    await repository.save(child);

    return newNode;
  };

  const updateContent = async (nodeId: NodeId, content: string): Promise<MindMapNode> => {
    const node = await repository.findById(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    const updated = { ...node, content };
    await repository.save(updated);
    return updated;
  };

  const deleteNode = async (nodeId: NodeId): Promise<Result<void, string>> => {
    const node = await repository.findById(nodeId);
    if (!node) return { ok: false, error: 'Node not found' };
    if (node.parentId === null) return { ok: false, error: 'Cannot delete root node' };
    if (await hasChildren(nodeId)) return { ok: false, error: 'Node has children' };
    await repository.delete(nodeId);
    return { ok: true, value: undefined };
  };

  const deleteNodeWithChildren = async (nodeId: NodeId): Promise<void> => {
    const children = await getChildren(nodeId);
    for (const child of children) {
      await deleteNodeWithChildren(child.id);
    }
    await repository.delete(nodeId);
  };

  const deleteChildren = async (nodeId: NodeId): Promise<void> => {
    const children = await getChildren(nodeId);
    for (const child of children) {
      await deleteNodeWithChildren(child.id);
    }
  };

  const ensureRootExists = async (): Promise<MindMapNode> => {
    const all = await getAllNodes();
    const root = all.find((n) => n.parentId === null);
    if (root) return root;
    return createNode('Root', null);
  };

  const getParentId = async (nodeId: NodeId): Promise<NodeId | null> => {
    const parent = await getParent(nodeId);
    return parent?.id ?? null;
  };

  const getFirstChildId = async (nodeId: NodeId): Promise<NodeId | null> => {
    const children = await getChildren(nodeId);
    return children[0]?.id ?? null;
  };

  const getSiblingsWithSelf = async (nodeId: NodeId): Promise<{ ids: NodeId[]; index: number }> => {
    const node = await getNode(nodeId);
    if (!node) return { ids: [], index: -1 };
    const siblings =
      node.parentId === null
        ? (await getAllNodes()).filter((n) => n.parentId === null)
        : await getChildren(node.parentId);
    const index = siblings.findIndex((n) => n.id === nodeId);
    return { ids: siblings.map((n) => n.id), index };
  };

  const getNextSiblingId = async (nodeId: NodeId): Promise<NodeId | null> => {
    const { ids, index } = await getSiblingsWithSelf(nodeId);
    if (index === -1 || index >= ids.length - 1) return null;
    return ids[index + 1];
  };

  const getPreviousSiblingId = async (nodeId: NodeId): Promise<NodeId | null> => {
    const { ids, index } = await getSiblingsWithSelf(nodeId);
    if (index <= 0) return null;
    return ids[index - 1];
  };

  return {
    getAllNodes,
    getNode,
    getRootNode,
    getChildren,
    getParent,
    getSiblings,
    hasChildren,
    isRootNode,
    getParentId,
    getFirstChildId,
    getNextSiblingId,
    getPreviousSiblingId,
    createNode,
    createSiblingAbove,
    createSiblingBelow,
    insertBetweenParentAndChild,
    updateContent,
    deleteNode,
    deleteNodeWithChildren,
    deleteChildren,
    ensureRootExists,
  };
}
