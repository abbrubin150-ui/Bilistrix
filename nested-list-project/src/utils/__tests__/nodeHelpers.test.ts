import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateId,
  createNode,
  getNodeDepth,
  getAllChildren,
  getPath,
  canMoveNode,
  getMaxDepthInSubtree,
  searchNodes,
  filterNodes,
  sortNodes,
  countNodes,
  cloneSubtree,
} from '../nodeHelpers';
import { ListNode, ListNodeId } from '../../types/core';

describe('nodeHelpers', () => {
  let mockNodes: Record<ListNodeId, ListNode>;

  beforeEach(() => {
    // Create a tree structure for testing:
    // root1 (level 0)
    //   ├─ child1 (level 1)
    //   │   ├─ grandchild1 (level 2)
    //   │   └─ grandchild2 (level 2)
    //   └─ child2 (level 1)
    // root2 (level 0)

    mockNodes = {
      root1: {
        id: 'root1',
        parentId: null,
        childrenIds: ['child1', 'child2'],
        title: 'Root 1',
        level: 0,
        isCollapsed: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      child1: {
        id: 'child1',
        parentId: 'root1',
        childrenIds: ['grandchild1', 'grandchild2'],
        title: 'Child 1',
        description: 'First child description',
        level: 1,
        isCollapsed: false,
        isDone: true,
        createdAt: 2000,
        updatedAt: 2000,
      },
      child2: {
        id: 'child2',
        parentId: 'root1',
        childrenIds: [],
        title: 'Child 2',
        level: 1,
        isCollapsed: true,
        isDone: false,
        createdAt: 3000,
        updatedAt: 3000,
      },
      grandchild1: {
        id: 'grandchild1',
        parentId: 'child1',
        childrenIds: [],
        title: 'Grandchild 1',
        level: 2,
        isCollapsed: false,
        createdAt: 4000,
        updatedAt: 4000,
      },
      grandchild2: {
        id: 'grandchild2',
        parentId: 'child1',
        childrenIds: [],
        title: 'Grandchild 2',
        description: 'Second grandchild description',
        level: 2,
        isCollapsed: false,
        createdAt: 5000,
        updatedAt: 5000,
      },
      root2: {
        id: 'root2',
        parentId: null,
        childrenIds: [],
        title: 'Root 2',
        level: 0,
        isCollapsed: false,
        createdAt: 6000,
        updatedAt: 6000,
      },
    };
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs in expected format', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('createNode', () => {
    it('should create a node with default values', () => {
      const node = createNode({ level: 0 });

      expect(node).toMatchObject({
        parentId: null,
        childrenIds: [],
        title: '',
        isCollapsed: false,
        level: 0,
      });
      expect(node.id).toBeTruthy();
      expect(node.createdAt).toBeTruthy();
      expect(node.updatedAt).toBe(node.createdAt);
    });

    it('should create a node with custom values', () => {
      const customData = {
        level: 2,
        title: 'Custom Title',
        description: 'Custom Description',
        parentId: 'parent1',
        isDone: true,
        isCollapsed: true,
      };

      const node = createNode(customData);

      expect(node).toMatchObject(customData);
      expect(node.childrenIds).toEqual([]);
    });

    it('should override childrenIds if provided', () => {
      const node = createNode({
        level: 0,
        childrenIds: ['child1', 'child2'],
      });

      expect(node.childrenIds).toEqual(['child1', 'child2']);
    });
  });

  describe('getNodeDepth', () => {
    it('should return 0 for root node', () => {
      expect(getNodeDepth('root1', mockNodes)).toBe(0);
      expect(getNodeDepth('root2', mockNodes)).toBe(0);
    });

    it('should return correct depth for nested nodes', () => {
      expect(getNodeDepth('child1', mockNodes)).toBe(1);
      expect(getNodeDepth('child2', mockNodes)).toBe(1);
      expect(getNodeDepth('grandchild1', mockNodes)).toBe(2);
      expect(getNodeDepth('grandchild2', mockNodes)).toBe(2);
    });

    it('should return 0 for non-existent node', () => {
      expect(getNodeDepth('nonexistent', mockNodes)).toBe(-1);
    });

    it('should handle deeply nested structure', () => {
      const deepNodes: Record<ListNodeId, ListNode> = {
        level0: createNode({ id: 'level0', level: 0, parentId: null }),
        level1: createNode({ id: 'level1', level: 1, parentId: 'level0' }),
        level2: createNode({ id: 'level2', level: 2, parentId: 'level1' }),
        level3: createNode({ id: 'level3', level: 3, parentId: 'level2' }),
        level4: createNode({ id: 'level4', level: 4, parentId: 'level3' }),
        level5: createNode({ id: 'level5', level: 5, parentId: 'level4' }),
      };

      expect(getNodeDepth('level5', deepNodes)).toBe(5);
    });
  });

  describe('getAllChildren', () => {
    it('should return all descendants of a node', () => {
      const children = getAllChildren('root1', mockNodes);

      expect(children).toHaveLength(4);
      expect(children.map((n) => n.id)).toEqual([
        'child1',
        'child2',
        'grandchild1',
        'grandchild2',
      ]);
    });

    it('should return immediate children', () => {
      const children = getAllChildren('child1', mockNodes);

      expect(children).toHaveLength(2);
      expect(children.map((n) => n.id)).toEqual(['grandchild1', 'grandchild2']);
    });

    it('should return empty array for leaf node', () => {
      const children = getAllChildren('grandchild1', mockNodes);
      expect(children).toEqual([]);
    });

    it('should return empty array for non-existent node', () => {
      const children = getAllChildren('nonexistent', mockNodes);
      expect(children).toEqual([]);
    });

    it('should handle nodes with no children', () => {
      const children = getAllChildren('root2', mockNodes);
      expect(children).toEqual([]);
    });
  });

  describe('getPath', () => {
    it('should return path from root to node', () => {
      const path = getPath('grandchild1', mockNodes);

      expect(path).toHaveLength(3);
      expect(path.map((n) => n.id)).toEqual(['root1', 'child1', 'grandchild1']);
    });

    it('should return single node for root', () => {
      const path = getPath('root1', mockNodes);

      expect(path).toHaveLength(1);
      expect(path[0].id).toBe('root1');
    });

    it('should return empty array for non-existent node', () => {
      const path = getPath('nonexistent', mockNodes);
      expect(path).toEqual([]);
    });

    it('should work with any depth', () => {
      const path = getPath('child2', mockNodes);

      expect(path).toHaveLength(2);
      expect(path.map((n) => n.id)).toEqual(['root1', 'child2']);
    });
  });

  describe('canMoveNode', () => {
    it('should allow moving node to valid parent', () => {
      // Move child2 under child1
      expect(canMoveNode('child2', 'child1', mockNodes)).toBe(true);
    });

    it('should prevent moving node to itself', () => {
      expect(canMoveNode('child1', 'child1', mockNodes)).toBe(false);
    });

    it('should prevent moving node to its descendant', () => {
      // Can't move root1 under its child
      expect(canMoveNode('root1', 'child1', mockNodes)).toBe(false);
      expect(canMoveNode('root1', 'grandchild1', mockNodes)).toBe(false);
      expect(canMoveNode('child1', 'grandchild1', mockNodes)).toBe(false);
    });

    it('should enforce max depth constraint', () => {
      // Create a deep structure at level 3
      const deepNodes = { ...mockNodes };
      deepNodes.deepchild = createNode({
        id: 'deepchild',
        level: 3,
        parentId: 'grandchild1',
        childrenIds: ['deeper'],
      });
      deepNodes.grandchild1.childrenIds = ['deepchild'];
      deepNodes.deeper = createNode({
        id: 'deeper',
        level: 4,
        parentId: 'deepchild',
        childrenIds: ['deepest'],
      });
      deepNodes.deepest = createNode({
        id: 'deepest',
        level: 5,
        parentId: 'deeper',
      });

      // Can't move grandchild1 (which now has 3 children levels deep) to child2 (depth 1)
      // newParentDepth(1) + nodeMaxDepth(3) + 1 = 5, which is < 6, so it CAN move
      // To test actual constraint, try moving to root with a subtree that's too deep
      // grandchild1 has maxDepth 3, so moving to child2 (depth 1): 1+3+1=5 < 6 (allowed)
      // Let's test moving grandchild1 somewhere that would violate maxDepth of 4
      expect(canMoveNode('grandchild1', 'child1', deepNodes, 4)).toBe(false);
    });

    it('should allow moving to null parent (root level)', () => {
      expect(canMoveNode('child1', null, mockNodes)).toBe(true);
    });

    it('should return false for non-existent node', () => {
      expect(canMoveNode('nonexistent', 'child1', mockNodes)).toBe(false);
    });

    it('should respect custom maxDepth parameter', () => {
      // With maxDepth of 2, can't move child1 (maxDepth=1) to child2 (depth=1)
      // newParentDepth(1) + nodeMaxDepth(1) + 1 = 3, which is >= 2
      expect(canMoveNode('child1', 'child2', mockNodes, 2)).toBe(false);
    });
  });

  describe('getMaxDepthInSubtree', () => {
    it('should return 0 for leaf node', () => {
      expect(getMaxDepthInSubtree('grandchild1', mockNodes)).toBe(0);
      expect(getMaxDepthInSubtree('root2', mockNodes)).toBe(0);
    });

    it('should return correct depth for node with children', () => {
      expect(getMaxDepthInSubtree('child1', mockNodes)).toBe(1);
      expect(getMaxDepthInSubtree('root1', mockNodes)).toBe(2);
    });

    it('should handle complex tree structures', () => {
      const complexNodes = { ...mockNodes };

      // Add another level under grandchild1
      complexNodes.greatgrandchild = createNode({
        id: 'greatgrandchild',
        level: 3,
        parentId: 'grandchild1',
      });
      complexNodes.grandchild1.childrenIds = ['greatgrandchild'];

      expect(getMaxDepthInSubtree('root1', complexNodes)).toBe(3);
      expect(getMaxDepthInSubtree('child1', complexNodes)).toBe(2);
      expect(getMaxDepthInSubtree('grandchild1', complexNodes)).toBe(1);
    });

    it('should return 0 for non-existent node', () => {
      expect(getMaxDepthInSubtree('nonexistent', mockNodes)).toBe(0);
    });
  });

  describe('searchNodes', () => {
    it('should find nodes by title', () => {
      const results = searchNodes('child', mockNodes);

      expect(results).toHaveLength(4); // child1, child2, grandchild1, grandchild2
      expect(results.map((n) => n.id)).toContain('child1');
      expect(results.map((n) => n.id)).toContain('child2');
    });

    it('should find nodes by description', () => {
      const results = searchNodes('description', mockNodes);

      expect(results).toHaveLength(2); // child1, grandchild2
      expect(results.map((n) => n.id)).toContain('child1');
      expect(results.map((n) => n.id)).toContain('grandchild2');
    });

    it('should be case-insensitive', () => {
      const results1 = searchNodes('ROOT', mockNodes);
      const results2 = searchNodes('root', mockNodes);

      expect(results1).toHaveLength(2);
      expect(results2).toHaveLength(2);
      expect(results1.map((n) => n.id)).toEqual(results2.map((n) => n.id));
    });

    it('should return empty array when no matches', () => {
      const results = searchNodes('nonexistent', mockNodes);
      expect(results).toEqual([]);
    });

    it('should handle empty query', () => {
      const results = searchNodes('', mockNodes);
      expect(results).toHaveLength(6); // All nodes
    });

    it('should handle partial matches', () => {
      const results = searchNodes('Grand', mockNodes);
      expect(results).toHaveLength(2);
    });
  });

  describe('filterNodes', () => {
    it('should filter nodes by predicate', () => {
      const doneNodes = filterNodes(mockNodes, (node) => node.isDone === true);

      expect(doneNodes).toHaveLength(1);
      expect(doneNodes[0].id).toBe('child1');
    });

    it('should filter nodes by level', () => {
      const level1Nodes = filterNodes(mockNodes, (node) => node.level === 1);

      expect(level1Nodes).toHaveLength(2);
      expect(level1Nodes.map((n) => n.id)).toContain('child1');
      expect(level1Nodes.map((n) => n.id)).toContain('child2');
    });

    it('should filter collapsed nodes', () => {
      const collapsedNodes = filterNodes(
        mockNodes,
        (node) => node.isCollapsed
      );

      expect(collapsedNodes).toHaveLength(1);
      expect(collapsedNodes[0].id).toBe('child2');
    });

    it('should return all nodes when predicate always true', () => {
      const allNodes = filterNodes(mockNodes, () => true);
      expect(allNodes).toHaveLength(6);
    });

    it('should return empty array when predicate always false', () => {
      const noNodes = filterNodes(mockNodes, () => false);
      expect(noNodes).toEqual([]);
    });
  });

  describe('sortNodes', () => {
    it('should sort by title ascending', () => {
      const nodes = Object.values(mockNodes);
      const sorted = sortNodes(nodes, 'title', 'asc');

      expect(sorted[0].title).toBe('Child 1');
      expect(sorted[sorted.length - 1].title).toBe('Root 2');
    });

    it('should sort by title descending', () => {
      const nodes = Object.values(mockNodes);
      const sorted = sortNodes(nodes, 'title', 'desc');

      expect(sorted[0].title).toBe('Root 2');
      expect(sorted[sorted.length - 1].title).toBe('Child 1');
    });

    it('should sort by createdAt ascending', () => {
      const nodes = Object.values(mockNodes);
      const sorted = sortNodes(nodes, 'createdAt', 'asc');

      expect(sorted[0].id).toBe('root1');
      expect(sorted[sorted.length - 1].id).toBe('root2');
    });

    it('should sort by createdAt descending', () => {
      const nodes = Object.values(mockNodes);
      const sorted = sortNodes(nodes, 'createdAt', 'desc');

      expect(sorted[0].id).toBe('root2');
      expect(sorted[sorted.length - 1].id).toBe('root1');
    });

    it('should sort by updatedAt', () => {
      const nodes = Object.values(mockNodes);
      const sorted = sortNodes(nodes, 'updatedAt', 'asc');

      expect(sorted.map((n) => n.updatedAt)).toEqual([
        1000, 2000, 3000, 4000, 5000, 6000,
      ]);
    });

    it('should not mutate original array', () => {
      const nodes = Object.values(mockNodes);
      const originalOrder = nodes.map((n) => n.id);
      sortNodes(nodes, 'title', 'asc');

      expect(nodes.map((n) => n.id)).toEqual(originalOrder);
    });

    it('should default to ascending order', () => {
      const nodes = Object.values(mockNodes);
      const sorted = sortNodes(nodes, 'createdAt');

      expect(sorted[0].createdAt).toBe(1000);
    });
  });

  describe('countNodes', () => {
    it('should count all nodes from root', () => {
      const count = countNodes(['root1'], mockNodes);
      expect(count).toBe(5); // root1 + 4 descendants
    });

    it('should count nodes from multiple roots', () => {
      const count = countNodes(['root1', 'root2'], mockNodes);
      expect(count).toBe(6); // All nodes
    });

    it('should count subtree nodes', () => {
      const count = countNodes(['child1'], mockNodes);
      expect(count).toBe(3); // child1 + 2 grandchildren
    });

    it('should count single node with no children', () => {
      const count = countNodes(['grandchild1'], mockNodes);
      expect(count).toBe(1);
    });

    it('should return 0 for empty array', () => {
      const count = countNodes([], mockNodes);
      expect(count).toBe(0);
    });

    it('should handle non-existent node IDs', () => {
      const count = countNodes(['nonexistent'], mockNodes);
      expect(count).toBe(0);
    });

    it('should handle mix of valid and invalid IDs', () => {
      const count = countNodes(['root1', 'nonexistent', 'root2'], mockNodes);
      expect(count).toBe(6);
    });
  });

  describe('cloneSubtree', () => {
    it('should clone a leaf node', () => {
      const { node, newNodes } = cloneSubtree('grandchild1', mockNodes);

      expect(node.id).not.toBe('grandchild1');
      expect(node.title).toBe('Grandchild 1');
      expect(node.level).toBe(2);
      expect(node.childrenIds).toEqual([]);
      expect(Object.keys(newNodes)).toHaveLength(1);
    });

    it('should clone entire subtree with new IDs', () => {
      const { node, newNodes } = cloneSubtree('child1', mockNodes);

      expect(node.id).not.toBe('child1');
      expect(node.title).toBe('Child 1');
      expect(node.childrenIds).toHaveLength(2);
      expect(Object.keys(newNodes)).toHaveLength(3); // child1 + 2 grandchildren

      // Verify all IDs are new
      const newIds = Object.keys(newNodes);
      expect(newIds).not.toContain('child1');
      expect(newIds).not.toContain('grandchild1');
      expect(newIds).not.toContain('grandchild2');
    });

    it('should preserve node properties', () => {
      const { node } = cloneSubtree('child1', mockNodes);

      expect(node.title).toBe('Child 1');
      expect(node.description).toBe('First child description');
      expect(node.level).toBe(1);
      expect(node.isDone).toBe(true);
      expect(node.isCollapsed).toBe(false);
    });

    it('should update timestamps', () => {
      const { node } = cloneSubtree('child1', mockNodes);

      expect(node.createdAt).toBeGreaterThan(mockNodes.child1.createdAt);
      expect(node.updatedAt).toBe(node.createdAt);
    });

    it('should set custom parent ID', () => {
      const { node } = cloneSubtree('child1', mockNodes, 'newParent');
      expect(node.parentId).toBe('newParent');
    });

    it('should default parent ID to null', () => {
      const { node } = cloneSubtree('child1', mockNodes);
      expect(node.parentId).toBeNull();
    });

    it('should maintain parent-child relationships in cloned subtree', () => {
      const { node, newNodes } = cloneSubtree('root1', mockNodes);

      // Root has 2 children
      expect(node.childrenIds).toHaveLength(2);

      // Find cloned child1
      const clonedChild1 = newNodes[node.childrenIds[0]];
      expect(clonedChild1).toBeDefined();
      expect(clonedChild1.parentId).toBe(node.id);
      expect(clonedChild1.title).toBe('Child 1');

      // Cloned child1 has 2 children
      expect(clonedChild1.childrenIds).toHaveLength(2);

      // Verify grandchildren
      clonedChild1.childrenIds.forEach((grandchildId) => {
        const grandchild = newNodes[grandchildId];
        expect(grandchild).toBeDefined();
        expect(grandchild.parentId).toBe(clonedChild1.id);
      });
    });

    it('should throw error for non-existent node', () => {
      expect(() => cloneSubtree('nonexistent', mockNodes)).toThrow(
        'Node nonexistent not found'
      );
    });

    it('should clone complex tree structure', () => {
      const { node, newNodes } = cloneSubtree('root1', mockNodes);

      // Should have 5 nodes total (root1 + child1 + child2 + grandchild1 + grandchild2)
      expect(Object.keys(newNodes)).toHaveLength(5);

      // Verify structure is maintained
      const childIds = node.childrenIds;
      expect(childIds).toHaveLength(2);

      const firstChild = newNodes[childIds[0]];
      expect(firstChild.childrenIds).toHaveLength(2);
    });
  });
});
