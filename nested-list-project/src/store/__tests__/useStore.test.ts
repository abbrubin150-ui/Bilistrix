import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../useStore';
import { ListNode, ViewMode } from '../../types/core';
import { act, renderHook } from '@testing-library/react';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Node CRUD Operations', () => {
    describe('createNode', () => {
      it('should create a root node', () => {
        const { result } = renderHook(() => useStore());

        let newNode: ListNode;
        act(() => {
          newNode = result.current.createNode(null, { title: 'Root Node' });
        });

        expect(newNode!).toBeDefined();
        expect(newNode!.title).toBe('Root Node');
        expect(newNode!.level).toBe(0);
        expect(newNode!.parentId).toBeNull();
        expect(result.current.rootNodeIds).toContain(newNode!.id);
        expect(result.current.nodes[newNode!.id]).toBeDefined();
      });

      it('should create a child node', () => {
        const { result } = renderHook(() => useStore());

        let parentNode: ListNode;
        let childNode: ListNode;

        act(() => {
          parentNode = result.current.createNode(null, { title: 'Parent' });
          childNode = result.current.createNode(parentNode.id, { title: 'Child' });
        });

        expect(childNode!.level).toBe(1);
        expect(childNode!.parentId).toBe(parentNode!.id);
        expect(result.current.nodes[parentNode!.id].childrenIds).toContain(childNode!.id);
        expect(result.current.nodes[parentNode!.id].isCollapsed).toBe(false); // Auto-expand
      });

      it('should enforce max depth constraint', () => {
        const { result } = renderHook(() => useStore());
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        let nodes: ListNode[] = [];

        act(() => {
          // Create chain of 6 nodes (levels 0-5)
          nodes[0] = result.current.createNode(null, { title: 'Level 0' });
          for (let i = 1; i < 6; i++) {
            nodes[i] = result.current.createNode(nodes[i - 1].id, {
              title: `Level ${i}`,
            });
          }

          // Try to create level 6 (should fail)
          const invalidNode = result.current.createNode(nodes[5].id, {
            title: 'Level 6',
          });
          expect(invalidNode).toBeNull();
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Cannot create node: max depth reached'
        );
        consoleWarnSpy.mockRestore();
      });

      it('should set timestamps correctly', () => {
        const { result } = renderHook(() => useStore());
        const beforeTime = Date.now();

        let newNode: ListNode;
        act(() => {
          newNode = result.current.createNode(null, { title: 'Test' });
        });

        const afterTime = Date.now();

        expect(newNode!.createdAt).toBeGreaterThanOrEqual(beforeTime);
        expect(newNode!.createdAt).toBeLessThanOrEqual(afterTime);
        expect(newNode!.updatedAt).toBe(newNode!.createdAt);
      });
    });

    describe('updateNode', () => {
      it('should update node properties', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;
        act(() => {
          const node = result.current.createNode(null, { title: 'Original' });
          nodeId = node.id;
        });

        act(() => {
          result.current.updateNode(nodeId, {
            title: 'Updated',
            description: 'New description',
            isDone: true,
          });
        });

        const updatedNode = result.current.nodes[nodeId];
        expect(updatedNode.title).toBe('Updated');
        expect(updatedNode.description).toBe('New description');
        expect(updatedNode.isDone).toBe(true);
      });

      it('should update timestamp when node is updated', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;
        let originalTime: number;

        act(() => {
          const node = result.current.createNode(null, { title: 'Test' });
          nodeId = node.id;
          originalTime = node.updatedAt;
        });

        act(() => {
          result.current.updateNode(nodeId, { title: 'Updated' });
        });

        expect(result.current.nodes[nodeId].updatedAt).toBeGreaterThanOrEqual(
          originalTime
        );
      });

      it('should handle non-existent node gracefully', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          result.current.updateNode('nonexistent', { title: 'Update' });
        });

        // Should not throw error
        expect(result.current.nodes['nonexistent']).toBeUndefined();
      });
    });

    describe('deleteNode', () => {
      it('should delete a leaf node', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;
        act(() => {
          const node = result.current.createNode(null, { title: 'To Delete' });
          nodeId = node.id;
        });

        act(() => {
          result.current.deleteNode(nodeId);
        });

        expect(result.current.nodes[nodeId]).toBeUndefined();
        expect(result.current.rootNodeIds).not.toContain(nodeId);
      });

      it('should delete node and all descendants', () => {
        const { result } = renderHook(() => useStore());

        let parentId: string;
        let childId: string;
        let grandchildId: string;

        act(() => {
          const parent = result.current.createNode(null, { title: 'Parent' });
          const child = result.current.createNode(parent.id, { title: 'Child' });
          const grandchild = result.current.createNode(child.id, {
            title: 'Grandchild',
          });

          parentId = parent.id;
          childId = child.id;
          grandchildId = grandchild.id;
        });

        act(() => {
          result.current.deleteNode(parentId);
        });

        expect(result.current.nodes[parentId]).toBeUndefined();
        expect(result.current.nodes[childId]).toBeUndefined();
        expect(result.current.nodes[grandchildId]).toBeUndefined();
      });

      it('should remove node from parent childrenIds', () => {
        const { result } = renderHook(() => useStore());

        let parentId: string;
        let childId: string;

        act(() => {
          const parent = result.current.createNode(null, { title: 'Parent' });
          const child = result.current.createNode(parent.id, { title: 'Child' });
          parentId = parent.id;
          childId = child.id;
        });

        act(() => {
          result.current.deleteNode(childId);
        });

        expect(result.current.nodes[parentId].childrenIds).not.toContain(childId);
      });

      it('should clear selection when deleted nodes are selected', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
          result.current.selectNode(nodeId);
        });

        expect(result.current.currentSession.selectedNodeIds).toContain(nodeId);

        act(() => {
          result.current.deleteNode(nodeId);
        });

        expect(result.current.currentSession.selectedNodeIds).not.toContain(
          nodeId
        );
      });

      it('should clear focus when focused node is deleted', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
          result.current.setFocusNode(nodeId);
        });

        expect(result.current.currentSession.focusedNodeId).toBe(nodeId);

        act(() => {
          result.current.deleteNode(nodeId);
        });

        expect(result.current.currentSession.focusedNodeId).toBeUndefined();
      });
    });

    describe('moveNode', () => {
      it('should move node to new parent', () => {
        const { result } = renderHook(() => useStore());

        let node1Id: string;
        let node2Id: string;
        let childId: string;

        act(() => {
          const node1 = result.current.createNode(null, { title: 'Node 1' });
          const node2 = result.current.createNode(null, { title: 'Node 2' });
          const child = result.current.createNode(node1.id, { title: 'Child' });

          node1Id = node1.id;
          node2Id = node2.id;
          childId = child.id;
        });

        act(() => {
          result.current.moveNode(childId, node2Id);
        });

        expect(result.current.nodes[childId].parentId).toBe(node2Id);
        expect(result.current.nodes[node1Id].childrenIds).not.toContain(childId);
        expect(result.current.nodes[node2Id].childrenIds).toContain(childId);
      });

      it('should update levels when moving node', () => {
        const { result } = renderHook(() => useStore());

        let rootId: string;
        let childId: string;
        let grandchildId: string;

        act(() => {
          const root = result.current.createNode(null, { title: 'Root' });
          const child = result.current.createNode(root.id, { title: 'Child' });
          const grandchild = result.current.createNode(child.id, {
            title: 'Grandchild',
          });

          rootId = root.id;
          childId = child.id;
          grandchildId = grandchild.id;
        });

        // Move child to root level
        act(() => {
          result.current.moveNode(childId, null);
        });

        expect(result.current.nodes[childId].level).toBe(0);
        expect(result.current.nodes[grandchildId].level).toBe(1);
      });

      it('should prevent moving node to itself', () => {
        const { result } = renderHook(() => useStore());
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
        });

        act(() => {
          result.current.moveNode(nodeId, nodeId);
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Cannot move node: invalid move'
        );
        consoleWarnSpy.mockRestore();
      });

      it('should prevent moving node to its descendant', () => {
        const { result } = renderHook(() => useStore());
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        let parentId: string;
        let childId: string;

        act(() => {
          const parent = result.current.createNode(null, { title: 'Parent' });
          const child = result.current.createNode(parent.id, { title: 'Child' });
          parentId = parent.id;
          childId = child.id;
        });

        act(() => {
          result.current.moveNode(parentId, childId);
        });

        expect(result.current.nodes[parentId].parentId).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
      });

      it('should respect position parameter', () => {
        const { result } = renderHook(() => useStore());

        let parentId: string;
        let child1Id: string;
        let child2Id: string;
        let child3Id: string;

        act(() => {
          const parent = result.current.createNode(null, { title: 'Parent' });
          const child1 = result.current.createNode(parent.id, { title: 'Child 1' });
          const child2 = result.current.createNode(parent.id, { title: 'Child 2' });
          const child3 = result.current.createNode(null, { title: 'Child 3' });

          parentId = parent.id;
          child1Id = child1.id;
          child2Id = child2.id;
          child3Id = child3.id;
        });

        // Move child3 to position 1 (between child1 and child2)
        act(() => {
          result.current.moveNode(child3Id, parentId, 1);
        });

        const children = result.current.nodes[parentId].childrenIds;
        expect(children[0]).toBe(child1Id);
        expect(children[1]).toBe(child3Id);
        expect(children[2]).toBe(child2Id);
      });
    });

    describe('duplicateNode', () => {
      it('should duplicate a leaf node', () => {
        const { result } = renderHook(() => useStore());

        let originalId: string;

        act(() => {
          const node = result.current.createNode(null, {
            title: 'Original',
            description: 'Description',
          });
          originalId = node.id;
        });

        act(() => {
          result.current.duplicateNode(originalId);
        });

        const rootIds = result.current.rootNodeIds;
        expect(rootIds).toHaveLength(2);

        const duplicateId = rootIds[1];
        const duplicate = result.current.nodes[duplicateId];

        expect(duplicate.id).not.toBe(originalId);
        expect(duplicate.title).toBe('Original');
        expect(duplicate.description).toBe('Description');
      });

      it('should duplicate node with entire subtree', () => {
        const { result } = renderHook(() => useStore());

        let parentId: string;

        act(() => {
          const parent = result.current.createNode(null, { title: 'Parent' });
          result.current.createNode(parent.id, { title: 'Child 1' });
          result.current.createNode(parent.id, { title: 'Child 2' });
          parentId = parent.id;
        });

        const originalCount = Object.keys(result.current.nodes).length;

        act(() => {
          result.current.duplicateNode(parentId);
        });

        // Should have doubled the nodes (parent + 2 children duplicated)
        expect(Object.keys(result.current.nodes).length).toBe(originalCount * 2);
      });

      it('should place duplicate next to original', () => {
        const { result } = renderHook(() => useStore());

        let node1Id: string;
        let node2Id: string;

        act(() => {
          const node1 = result.current.createNode(null, { title: 'Node 1' });
          const node2 = result.current.createNode(null, { title: 'Node 2' });
          node1Id = node1.id;
          node2Id = node2.id;
        });

        act(() => {
          result.current.duplicateNode(node1Id);
        });

        const rootIds = result.current.rootNodeIds;
        expect(rootIds[0]).toBe(node1Id);
        expect(rootIds[2]).toBe(node2Id);
        // Duplicate should be at index 1
      });
    });
  });

  describe('Node Operations', () => {
    describe('toggleCollapse', () => {
      it('should toggle node collapse state', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
        });

        expect(result.current.nodes[nodeId].isCollapsed).toBe(false);

        act(() => {
          result.current.toggleCollapse(nodeId);
        });

        expect(result.current.nodes[nodeId].isCollapsed).toBe(true);

        act(() => {
          result.current.toggleCollapse(nodeId);
        });

        expect(result.current.nodes[nodeId].isCollapsed).toBe(false);
      });
    });

    describe('toggleDone', () => {
      it('should toggle node done state', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Task' });
          nodeId = node.id;
        });

        act(() => {
          result.current.toggleDone(nodeId);
        });

        expect(result.current.nodes[nodeId].isDone).toBe(true);

        act(() => {
          result.current.toggleDone(nodeId);
        });

        expect(result.current.nodes[nodeId].isDone).toBe(false);
      });
    });

    describe('togglePin', () => {
      it('should toggle node pin state', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
        });

        act(() => {
          result.current.togglePin(nodeId);
        });

        expect(result.current.nodes[nodeId].isPinned).toBe(true);

        act(() => {
          result.current.togglePin(nodeId);
        });

        expect(result.current.nodes[nodeId].isPinned).toBe(false);
      });
    });

    describe('collapseAll', () => {
      it('should collapse all nodes with children', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          const parent1 = result.current.createNode(null, { title: 'Parent 1' });
          result.current.createNode(parent1.id, { title: 'Child 1' });

          const parent2 = result.current.createNode(null, { title: 'Parent 2' });
          result.current.createNode(parent2.id, { title: 'Child 2' });

          result.current.createNode(null, { title: 'Leaf' });
        });

        act(() => {
          result.current.collapseAll();
        });

        Object.values(result.current.nodes).forEach((node) => {
          if (node.childrenIds.length > 0) {
            expect(node.isCollapsed).toBe(true);
          }
        });
      });
    });

    describe('expandAll', () => {
      it('should expand all nodes', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          const parent = result.current.createNode(null, {
            title: 'Parent',
            isCollapsed: true,
          });
          result.current.createNode(parent.id, { title: 'Child' });
        });

        act(() => {
          result.current.expandAll();
        });

        Object.values(result.current.nodes).forEach((node) => {
          expect(node.isCollapsed).toBe(false);
        });
      });
    });

    describe('collapseToLevel', () => {
      it('should collapse nodes at or below specified level', () => {
        const { result } = renderHook(() => useStore());

        let level0Id: string;
        let level1Id: string;
        let level2Id: string;

        act(() => {
          const level0 = result.current.createNode(null, { title: 'Level 0' });
          const level1 = result.current.createNode(level0.id, { title: 'Level 1' });
          const level2 = result.current.createNode(level1.id, { title: 'Level 2' });
          result.current.createNode(level2.id, { title: 'Level 3' });

          level0Id = level0.id;
          level1Id = level1.id;
          level2Id = level2.id;
        });

        act(() => {
          result.current.collapseToLevel(1);
        });

        expect(result.current.nodes[level0Id].isCollapsed).toBe(false);
        expect(result.current.nodes[level1Id].isCollapsed).toBe(true);
        expect(result.current.nodes[level2Id].isCollapsed).toBe(true);
      });
    });
  });

  describe('Selection Management', () => {
    describe('selectNode', () => {
      it('should select a single node', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
        });

        act(() => {
          result.current.selectNode(nodeId);
        });

        expect(result.current.currentSession.selectedNodeIds).toEqual([nodeId]);
      });

      it('should replace selection when multi is false', () => {
        const { result } = renderHook(() => useStore());

        let node1Id: string;
        let node2Id: string;

        act(() => {
          const node1 = result.current.createNode(null, { title: 'Node 1' });
          const node2 = result.current.createNode(null, { title: 'Node 2' });
          node1Id = node1.id;
          node2Id = node2.id;
        });

        act(() => {
          result.current.selectNode(node1Id);
          result.current.selectNode(node2Id, false);
        });

        expect(result.current.currentSession.selectedNodeIds).toEqual([node2Id]);
      });

      it('should add to selection when multi is true', () => {
        const { result } = renderHook(() => useStore());

        let node1Id: string;
        let node2Id: string;

        act(() => {
          const node1 = result.current.createNode(null, { title: 'Node 1' });
          const node2 = result.current.createNode(null, { title: 'Node 2' });
          node1Id = node1.id;
          node2Id = node2.id;
        });

        act(() => {
          result.current.selectNode(node1Id);
          result.current.selectNode(node2Id, true);
        });

        expect(result.current.currentSession.selectedNodeIds).toContain(node1Id);
        expect(result.current.currentSession.selectedNodeIds).toContain(node2Id);
      });

      it('should not duplicate selection with multi select', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
        });

        act(() => {
          result.current.selectNode(nodeId);
          result.current.selectNode(nodeId, true);
        });

        expect(result.current.currentSession.selectedNodeIds).toEqual([nodeId]);
      });
    });

    describe('deselectNode', () => {
      it('should remove node from selection', () => {
        const { result } = renderHook(() => useStore());

        let node1Id: string;
        let node2Id: string;

        act(() => {
          const node1 = result.current.createNode(null, { title: 'Node 1' });
          const node2 = result.current.createNode(null, { title: 'Node 2' });
          node1Id = node1.id;
          node2Id = node2.id;

          result.current.selectNode(node1Id);
          result.current.selectNode(node2Id, true);
        });

        act(() => {
          result.current.deselectNode(node1Id);
        });

        expect(result.current.currentSession.selectedNodeIds).not.toContain(
          node1Id
        );
        expect(result.current.currentSession.selectedNodeIds).toContain(node2Id);
      });
    });

    describe('clearSelection', () => {
      it('should clear all selections', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          const node1 = result.current.createNode(null, { title: 'Node 1' });
          const node2 = result.current.createNode(null, { title: 'Node 2' });

          result.current.selectNode(node1.id);
          result.current.selectNode(node2.id, true);
        });

        act(() => {
          result.current.clearSelection();
        });

        expect(result.current.currentSession.selectedNodeIds).toEqual([]);
      });
    });

    describe('selectAll', () => {
      it('should select all nodes', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          result.current.createNode(null, { title: 'Node 1' });
          result.current.createNode(null, { title: 'Node 2' });
          result.current.createNode(null, { title: 'Node 3' });
        });

        act(() => {
          result.current.selectAll();
        });

        expect(result.current.currentSession.selectedNodeIds).toHaveLength(3);
      });
    });
  });

  describe('Focus Management', () => {
    describe('setFocusNode', () => {
      it('should set focused node', () => {
        const { result } = renderHook(() => useStore());

        let nodeId: string;

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
        });

        act(() => {
          result.current.setFocusNode(nodeId);
        });

        expect(result.current.currentSession.focusedNodeId).toBe(nodeId);
      });

      it('should clear focus when undefined', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          result.current.setFocusNode(node.id);
        });

        act(() => {
          result.current.setFocusNode(undefined);
        });

        expect(result.current.currentSession.focusedNodeId).toBeUndefined();
      });
    });

    describe('zoomIn', () => {
      it('should set focus and build path', () => {
        const { result } = renderHook(() => useStore());

        let parentId: string;
        let childId: string;

        act(() => {
          const parent = result.current.createNode(null, { title: 'Parent' });
          const child = result.current.createNode(parent.id, { title: 'Child' });
          parentId = parent.id;
          childId = child.id;
        });

        act(() => {
          result.current.zoomIn(childId);
        });

        expect(result.current.currentSession.focusedNodeId).toBe(childId);
        expect(result.current.currentSession.focusPath).toEqual([parentId, childId]);
      });
    });

    describe('zoomOut', () => {
      it('should navigate up one level', () => {
        const { result } = renderHook(() => useStore());

        let parentId: string;
        let childId: string;

        act(() => {
          const parent = result.current.createNode(null, { title: 'Parent' });
          const child = result.current.createNode(parent.id, { title: 'Child' });
          parentId = parent.id;
          childId = child.id;

          result.current.zoomIn(childId);
        });

        act(() => {
          result.current.zoomOut();
        });

        expect(result.current.currentSession.focusedNodeId).toBe(parentId);
        expect(result.current.currentSession.focusPath).toEqual([parentId]);
      });

      it('should exit focus mode when at root', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          const node = result.current.createNode(null, { title: 'Node' });
          result.current.zoomIn(node.id);
        });

        act(() => {
          result.current.zoomOut();
        });

        expect(result.current.currentSession.focusedNodeId).toBeUndefined();
        expect(result.current.currentSession.focusPath).toBeUndefined();
      });
    });
  });

  describe('Session Management', () => {
    describe('setViewMode', () => {
      it('should change view mode', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          result.current.setViewMode('board');
        });

        expect(result.current.currentSession.viewMode).toBe('board');

        act(() => {
          result.current.setViewMode('timeline');
        });

        expect(result.current.currentSession.viewMode).toBe('timeline');
      });
    });

    describe('setRTL', () => {
      it('should toggle RTL mode', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          result.current.setRTL(true);
        });

        expect(result.current.currentSession.rtl).toBe(true);

        act(() => {
          result.current.setRTL(false);
        });

        expect(result.current.currentSession.rtl).toBe(false);
      });
    });

    describe('updateSession', () => {
      it('should update session properties', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          result.current.updateSession({
            name: 'Updated Session',
            description: 'New description',
          });
        });

        expect(result.current.currentSession.name).toBe('Updated Session');
        expect(result.current.currentSession.description).toBe('New description');
      });
    });
  });

  describe('Filter Management', () => {
    describe('setFilter', () => {
      it('should set filter configuration', () => {
        const { result } = renderHook(() => useStore());

        const filterConfig = {
          text: 'search',
          level: 1,
          showCompleted: false,
        };

        act(() => {
          result.current.setFilter(filterConfig);
        });

        expect(result.current.filterConfig).toEqual(filterConfig);
      });
    });

    describe('clearFilter', () => {
      it('should clear filter configuration', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          result.current.setFilter({ text: 'test' });
          result.current.clearFilter();
        });

        expect(result.current.filterConfig).toEqual({});
      });
    });
  });

  describe('Command Palette', () => {
    describe('toggleCommandPalette', () => {
      it('should toggle command palette state', () => {
        const { result } = renderHook(() => useStore());

        expect(result.current.commandPaletteOpen).toBe(false);

        act(() => {
          result.current.toggleCommandPalette();
        });

        expect(result.current.commandPaletteOpen).toBe(true);

        act(() => {
          result.current.toggleCommandPalette();
        });

        expect(result.current.commandPaletteOpen).toBe(false);
      });
    });

    describe('closeCommandPalette', () => {
      it('should close command palette', () => {
        const { result } = renderHook(() => useStore());

        act(() => {
          result.current.toggleCommandPalette();
        });

        expect(result.current.commandPaletteOpen).toBe(true);

        act(() => {
          result.current.closeCommandPalette();
        });

        expect(result.current.commandPaletteOpen).toBe(false);
      });
    });
  });
});
