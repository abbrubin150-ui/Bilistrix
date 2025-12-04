import { ListNode, ListNodeId } from '../types/core';

/**
 * Utility functions for working with nodes
 */

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createNode = (
  data: Partial<ListNode> & { level: number }
): ListNode => {
  const now = Date.now();
  return {
    id: generateId(),
    parentId: null,
    childrenIds: [],
    title: '',
    isCollapsed: false,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
};

export const getNodeDepth = (
  nodeId: ListNodeId,
  nodes: Record<ListNodeId, ListNode>
): number => {
  let depth = 0;
  let currentId: ListNodeId | null = nodeId;

  while (currentId && nodes[currentId]) {
    const node: ListNode = nodes[currentId];
    currentId = node.parentId;
    depth++;
  }

  return depth - 1; // Subtract 1 because we count the node itself
};

export const getAllChildren = (
  nodeId: ListNodeId,
  nodes: Record<ListNodeId, ListNode>
): ListNode[] => {
  const node = nodes[nodeId];
  if (!node) return [];

  const children: ListNode[] = [];
  const queue = [...node.childrenIds];

  while (queue.length > 0) {
    const childId = queue.shift()!;
    const child = nodes[childId];
    if (child) {
      children.push(child);
      queue.push(...child.childrenIds);
    }
  }

  return children;
};

export const getPath = (
  nodeId: ListNodeId,
  nodes: Record<ListNodeId, ListNode>
): ListNode[] => {
  const path: ListNode[] = [];
  let currentId: ListNodeId | null = nodeId;

  while (currentId && nodes[currentId]) {
    const node: ListNode = nodes[currentId];
    path.unshift(node);
    currentId = node.parentId;
  }

  return path;
};

export const canMoveNode = (
  nodeId: ListNodeId,
  newParentId: ListNodeId | null,
  nodes: Record<ListNodeId, ListNode>,
  maxDepth: number = 6
): boolean => {
  // Can't move to itself
  if (nodeId === newParentId) return false;

  // Can't move to one of its descendants
  if (newParentId) {
    const path = getPath(newParentId, nodes);
    if (path.some((n) => n.id === nodeId)) return false;
  }

  // Check depth constraint
  const node = nodes[nodeId];
  if (!node) return false;

  const nodeMaxDepth = getMaxDepthInSubtree(nodeId, nodes);
  const newParentDepth = newParentId ? getNodeDepth(newParentId, nodes) : -1;

  return newParentDepth + nodeMaxDepth + 1 < maxDepth;
};

export const getMaxDepthInSubtree = (
  nodeId: ListNodeId,
  nodes: Record<ListNodeId, ListNode>
): number => {
  const node = nodes[nodeId];
  if (!node || node.childrenIds.length === 0) return 0;

  return (
    1 +
    Math.max(
      ...node.childrenIds.map((childId) => getMaxDepthInSubtree(childId, nodes))
    )
  );
};

export const searchNodes = (
  query: string,
  nodes: Record<ListNodeId, ListNode>
): ListNode[] => {
  const lowerQuery = query.toLowerCase();
  return Object.values(nodes).filter(
    (node) =>
      node.title.toLowerCase().includes(lowerQuery) ||
      node.description?.toLowerCase().includes(lowerQuery)
  );
};

export const filterNodes = (
  nodes: Record<ListNodeId, ListNode>,
  predicate: (node: ListNode) => boolean
): ListNode[] => {
  return Object.values(nodes).filter(predicate);
};

export const sortNodes = (
  nodes: ListNode[],
  sortBy: 'createdAt' | 'updatedAt' | 'title',
  order: 'asc' | 'desc' = 'asc'
): ListNode[] => {
  const sorted = [...nodes].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title, 'he');
    } else {
      comparison = a[sortBy] - b[sortBy];
    }
    return order === 'asc' ? comparison : -comparison;
  });
  return sorted;
};

export const countNodes = (
  rootIds: ListNodeId[],
  nodes: Record<ListNodeId, ListNode>
): number => {
  let count = 0;
  const queue = [...rootIds];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodes[id];
    if (node) {
      count++;
      queue.push(...node.childrenIds);
    }
  }

  return count;
};

export const cloneSubtree = (
  nodeId: ListNodeId,
  nodes: Record<ListNodeId, ListNode>,
  parentId: ListNodeId | null = null
): { node: ListNode; newNodes: Record<ListNodeId, ListNode> } => {
  const originalNode = nodes[nodeId];
  if (!originalNode) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const newNodes: Record<ListNodeId, ListNode> = {};
  const now = Date.now();

  const cloneRecursive = (
    origId: ListNodeId,
    newParentId: ListNodeId | null
  ): ListNode => {
    const orig = nodes[origId];
    const newId = generateId();

    const newNode: ListNode = {
      ...orig,
      id: newId,
      parentId: newParentId,
      childrenIds: [],
      createdAt: now,
      updatedAt: now,
    };

    newNodes[newId] = newNode;

    // Clone children
    if (orig.childrenIds.length > 0) {
      const newChildrenIds = orig.childrenIds.map((childId) => {
        const childNode = cloneRecursive(childId, newId);
        return childNode.id;
      });
      newNode.childrenIds = newChildrenIds;
    }

    return newNode;
  };

  const rootNode = cloneRecursive(nodeId, parentId);
  return { node: rootNode, newNodes };
};
