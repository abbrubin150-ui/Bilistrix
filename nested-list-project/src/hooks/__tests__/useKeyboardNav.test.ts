import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNav } from '../useKeyboardNav';
import { useStore } from '../../store/useStore';

describe('useKeyboardNav', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.reset();
    });
  });

  afterEach(() => {
    // Clean up any event listeners
    vi.clearAllMocks();
  });

  const createKeyboardEvent = (
    key: string,
    options: {
      shiftKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      target?: HTMLElement;
    } = {}
  ): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', {
      key,
      shiftKey: options.shiftKey || false,
      ctrlKey: options.ctrlKey || false,
      metaKey: options.metaKey || false,
      bubbles: true,
      cancelable: true,
    });

    // Override target if provided
    if (options.target) {
      Object.defineProperty(event, 'target', {
        value: options.target,
        writable: false,
      });
    }

    return event;
  };

  const dispatchKey = (
    key: string,
    options?: {
      shiftKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      target?: HTMLElement;
    }
  ) => {
    act(() => {
      const event = createKeyboardEvent(key, options);
      window.dispatchEvent(event);
    });
  };

  describe('Setup and Cleanup', () => {
    it('should register keydown event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      renderHook(() => useKeyboardNav());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useKeyboardNav());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('Input Field Protection', () => {
    it('should not handle keys when typing in input field', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let nodeId: string;
      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Node' });
        nodeId = node.id;
        storeResult.current.selectNode(nodeId);
      });

      const input = document.createElement('input');
      dispatchKey('Delete', { target: input });

      // Node should still exist (delete was ignored)
      expect(storeResult.current.nodes[nodeId]).toBeDefined();
    });

    it('should not handle keys when typing in textarea', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let nodeId: string;
      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Node' });
        nodeId = node.id;
        storeResult.current.selectNode(nodeId);
      });

      const textarea = document.createElement('textarea');
      dispatchKey('Delete', { target: textarea });

      // Node should still exist (delete was ignored)
      expect(storeResult.current.nodes[nodeId]).toBeDefined();
    });
  });

  describe('Arrow Navigation', () => {
    describe('ArrowDown', () => {
      it('should select first root node when nothing selected', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let rootId: string;
        act(() => {
          const node = storeResult.current.createNode(null, { title: 'Root' });
          rootId = node.id;
        });

        dispatchKey('ArrowDown');

        expect(storeResult.current.currentSession.selectedNodeIds).toContain(
          rootId
        );
      });

      it('should navigate to first child when node is expanded', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let parentId: string;
        let childId: string;

        act(() => {
          const parent = storeResult.current.createNode(null, {
            title: 'Parent',
          });
          const child = storeResult.current.createNode(parent.id, {
            title: 'Child',
          });
          parentId = parent.id;
          childId = child.id;
          storeResult.current.selectNode(parentId);
        });

        dispatchKey('ArrowDown');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          childId
        );
      });

      it('should skip children when node is collapsed', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let node1Id: string;
        let node2Id: string;

        act(() => {
          const node1 = storeResult.current.createNode(null, {
            title: 'Node 1',
          });
          storeResult.current.createNode(node1.id, { title: 'Child' });
          const node2 = storeResult.current.createNode(null, {
            title: 'Node 2',
          });

          node1Id = node1.id;
          node2Id = node2.id;

          storeResult.current.toggleCollapse(node1Id);
          storeResult.current.selectNode(node1Id);
        });

        dispatchKey('ArrowDown');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          node2Id
        );
      });

      it('should navigate to next sibling when no children', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let node1Id: string;
        let node2Id: string;

        act(() => {
          const node1 = storeResult.current.createNode(null, {
            title: 'Node 1',
          });
          const node2 = storeResult.current.createNode(null, {
            title: 'Node 2',
          });
          node1Id = node1.id;
          node2Id = node2.id;
          storeResult.current.selectNode(node1Id);
        });

        dispatchKey('ArrowDown');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          node2Id
        );
      });

      it('should navigate to parent next sibling when at last sibling', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let parentId: string;
        let childId: string;
        let uncleId: string;

        act(() => {
          const parent = storeResult.current.createNode(null, {
            title: 'Parent',
          });
          const child = storeResult.current.createNode(parent.id, {
            title: 'Child',
          });
          const uncle = storeResult.current.createNode(null, { title: 'Uncle' });

          parentId = parent.id;
          childId = child.id;
          uncleId = uncle.id;

          storeResult.current.selectNode(childId);
        });

        dispatchKey('ArrowDown');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          uncleId
        );
      });
    });

    describe('ArrowUp', () => {
      it('should do nothing when no node selected', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        act(() => {
          storeResult.current.createNode(null, { title: 'Root' });
        });

        dispatchKey('ArrowUp');

        expect(storeResult.current.currentSession.selectedNodeIds).toEqual([]);
      });

      it('should navigate to previous sibling', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let node1Id: string;
        let node2Id: string;

        act(() => {
          const node1 = storeResult.current.createNode(null, {
            title: 'Node 1',
          });
          const node2 = storeResult.current.createNode(null, {
            title: 'Node 2',
          });
          node1Id = node1.id;
          node2Id = node2.id;
          storeResult.current.selectNode(node2Id);
        });

        dispatchKey('ArrowUp');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          node1Id
        );
      });

      it('should navigate to previous sibling last visible descendant', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let node1Id: string;
        let childId: string;
        let node2Id: string;

        act(() => {
          const node1 = storeResult.current.createNode(null, {
            title: 'Node 1',
          });
          const child = storeResult.current.createNode(node1.id, {
            title: 'Child',
          });
          const node2 = storeResult.current.createNode(null, {
            title: 'Node 2',
          });

          node1Id = node1.id;
          childId = child.id;
          node2Id = node2.id;

          storeResult.current.selectNode(node2Id);
        });

        dispatchKey('ArrowUp');

        // Should go to child (last visible descendant of node1)
        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          childId
        );
      });

      it('should navigate to parent when at first sibling', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let parentId: string;
        let childId: string;

        act(() => {
          const parent = storeResult.current.createNode(null, {
            title: 'Parent',
          });
          const child = storeResult.current.createNode(parent.id, {
            title: 'Child',
          });
          parentId = parent.id;
          childId = child.id;
          storeResult.current.selectNode(childId);
        });

        dispatchKey('ArrowUp');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          parentId
        );
      });
    });

    describe('ArrowRight', () => {
      it('should navigate to first child when node is expanded', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let parentId: string;
        let childId: string;

        act(() => {
          const parent = storeResult.current.createNode(null, {
            title: 'Parent',
          });
          const child = storeResult.current.createNode(parent.id, {
            title: 'Child',
          });
          parentId = parent.id;
          childId = child.id;
          storeResult.current.selectNode(parentId);
        });

        dispatchKey('ArrowRight');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          childId
        );
      });

      it('should do nothing when node is collapsed', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let parentId: string;

        act(() => {
          const parent = storeResult.current.createNode(null, {
            title: 'Parent',
          });
          storeResult.current.createNode(parent.id, { title: 'Child' });
          parentId = parent.id;

          storeResult.current.toggleCollapse(parentId);
          storeResult.current.selectNode(parentId);
        });

        dispatchKey('ArrowRight');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          parentId
        );
      });

      it('should do nothing when node has no children', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let nodeId: string;

        act(() => {
          const node = storeResult.current.createNode(null, { title: 'Node' });
          nodeId = node.id;
          storeResult.current.selectNode(nodeId);
        });

        dispatchKey('ArrowRight');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          nodeId
        );
      });
    });

    describe('ArrowLeft', () => {
      it('should navigate to parent', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let parentId: string;
        let childId: string;

        act(() => {
          const parent = storeResult.current.createNode(null, {
            title: 'Parent',
          });
          const child = storeResult.current.createNode(parent.id, {
            title: 'Child',
          });
          parentId = parent.id;
          childId = child.id;
          storeResult.current.selectNode(childId);
        });

        dispatchKey('ArrowLeft');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          parentId
        );
      });

      it('should do nothing for root nodes', () => {
        const { result: storeResult } = renderHook(() => useStore());
        renderHook(() => useKeyboardNav());

        let rootId: string;

        act(() => {
          const root = storeResult.current.createNode(null, { title: 'Root' });
          rootId = root.id;
          storeResult.current.selectNode(rootId);
        });

        dispatchKey('ArrowLeft');

        expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
          rootId
        );
      });
    });
  });

  describe('Space - Toggle Collapse', () => {
    it('should toggle collapse state', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let nodeId: string;

      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Node' });
        nodeId = node.id;
        storeResult.current.selectNode(nodeId);
      });

      expect(storeResult.current.nodes[nodeId].isCollapsed).toBe(false);

      dispatchKey(' ');

      expect(storeResult.current.nodes[nodeId].isCollapsed).toBe(true);

      dispatchKey(' ');

      expect(storeResult.current.nodes[nodeId].isCollapsed).toBe(false);
    });
  });

  describe('Enter - Create Sibling', () => {
    it('should create sibling node at same level', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let nodeId: string;

      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Node' });
        nodeId = node.id;
        storeResult.current.selectNode(nodeId);
      });

      const beforeCount = Object.keys(storeResult.current.nodes).length;

      dispatchKey('Enter');

      expect(Object.keys(storeResult.current.nodes).length).toBe(
        beforeCount + 1
      );
      expect(storeResult.current.rootNodeIds).toHaveLength(2);
    });

    it('should select newly created sibling', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let originalId: string;

      act(() => {
        const node = storeResult.current.createNode(null, {
          title: 'Original',
        });
        originalId = node.id;
        storeResult.current.selectNode(originalId);
      });

      dispatchKey('Enter');

      const selectedId = storeResult.current.currentSession.selectedNodeIds[0];
      expect(selectedId).not.toBe(originalId);
      expect(storeResult.current.nodes[selectedId]).toBeDefined();
    });
  });

  describe('Shift+Enter - Create Child', () => {
    it('should create child node', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let parentId: string;

      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Parent' });
        parentId = node.id;
        storeResult.current.selectNode(parentId);
      });

      dispatchKey('Enter', { shiftKey: true });

      expect(storeResult.current.nodes[parentId].childrenIds).toHaveLength(1);
    });

    it('should not create child at max depth (level 5)', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let deepNodeId: string;

      act(() => {
        let node = storeResult.current.createNode(null, { title: 'Level 0' });
        for (let i = 1; i <= 5; i++) {
          node = storeResult.current.createNode(node.id, {
            title: `Level ${i}`,
          });
        }
        deepNodeId = node.id;
        storeResult.current.selectNode(deepNodeId);
      });

      const beforeCount = Object.keys(storeResult.current.nodes).length;

      dispatchKey('Enter', { shiftKey: true });

      // Should not create new node at level 6
      expect(Object.keys(storeResult.current.nodes).length).toBe(beforeCount);
    });

    it('should select newly created child', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let parentId: string;

      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Parent' });
        parentId = node.id;
        storeResult.current.selectNode(parentId);
      });

      dispatchKey('Enter', { shiftKey: true });

      const selectedId = storeResult.current.currentSession.selectedNodeIds[0];
      expect(selectedId).not.toBe(parentId);
      expect(storeResult.current.nodes[selectedId].parentId).toBe(parentId);
    });
  });

  describe('Delete/Backspace - Delete Node', () => {
    it('should delete selected node with Delete key', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let nodeId: string;

      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Node' });
        nodeId = node.id;
        storeResult.current.selectNode(nodeId);
      });

      dispatchKey('Delete');

      expect(storeResult.current.nodes[nodeId]).toBeUndefined();
    });

    it('should delete selected node with Backspace key', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let nodeId: string;

      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Node' });
        nodeId = node.id;
        storeResult.current.selectNode(nodeId);
      });

      dispatchKey('Backspace');

      expect(storeResult.current.nodes[nodeId]).toBeUndefined();
    });

    it('should select next sibling after deletion', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let node1Id: string;
      let node2Id: string;

      act(() => {
        const node1 = storeResult.current.createNode(null, { title: 'Node 1' });
        const node2 = storeResult.current.createNode(null, { title: 'Node 2' });
        node1Id = node1.id;
        node2Id = node2.id;
        storeResult.current.selectNode(node1Id);
      });

      dispatchKey('Delete');

      expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
        node2Id
      );
    });

    it('should select previous sibling when deleting last node', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let node1Id: string;
      let node2Id: string;

      act(() => {
        const node1 = storeResult.current.createNode(null, { title: 'Node 1' });
        const node2 = storeResult.current.createNode(null, { title: 'Node 2' });
        node1Id = node1.id;
        node2Id = node2.id;
        storeResult.current.selectNode(node2Id);
      });

      dispatchKey('Delete');

      expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
        node1Id
      );
    });

    it('should select parent when deleting only child', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let parentId: string;
      let childId: string;

      act(() => {
        const parent = storeResult.current.createNode(null, {
          title: 'Parent',
        });
        const child = storeResult.current.createNode(parent.id, {
          title: 'Child',
        });
        parentId = parent.id;
        childId = child.id;
        storeResult.current.selectNode(childId);
      });

      dispatchKey('Delete');

      expect(storeResult.current.currentSession.selectedNodeIds[0]).toBe(
        parentId
      );
    });
  });

  describe('Tab - Indent (Increase Level)', () => {
    it('should indent node by making it child of previous sibling', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let node1Id: string;
      let node2Id: string;

      act(() => {
        const node1 = storeResult.current.createNode(null, { title: 'Node 1' });
        const node2 = storeResult.current.createNode(null, { title: 'Node 2' });
        node1Id = node1.id;
        node2Id = node2.id;
        storeResult.current.selectNode(node2Id);
      });

      dispatchKey('Tab');

      expect(storeResult.current.nodes[node2Id].parentId).toBe(node1Id);
      expect(storeResult.current.nodes[node1Id].childrenIds).toContain(node2Id);
    });

    it('should not indent first sibling', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let node1Id: string;

      act(() => {
        const node1 = storeResult.current.createNode(null, { title: 'Node 1' });
        storeResult.current.createNode(null, { title: 'Node 2' });
        node1Id = node1.id;
        storeResult.current.selectNode(node1Id);
      });

      dispatchKey('Tab');

      // Should remain at root level
      expect(storeResult.current.nodes[node1Id].parentId).toBeNull();
    });
  });

  describe('Shift+Tab - Outdent (Decrease Level)', () => {
    it('should outdent node by moving to grandparent', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let parentId: string;
      let childId: string;

      act(() => {
        const parent = storeResult.current.createNode(null, {
          title: 'Parent',
        });
        const child = storeResult.current.createNode(parent.id, {
          title: 'Child',
        });
        parentId = parent.id;
        childId = child.id;
        storeResult.current.selectNode(childId);
      });

      dispatchKey('Tab', { shiftKey: true });

      expect(storeResult.current.nodes[childId].parentId).toBeNull();
      expect(storeResult.current.nodes[parentId].childrenIds).not.toContain(
        childId
      );
    });

    it('should not outdent root nodes', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let rootId: string;

      act(() => {
        const root = storeResult.current.createNode(null, { title: 'Root' });
        rootId = root.id;
        storeResult.current.selectNode(rootId);
      });

      dispatchKey('Tab', { shiftKey: true });

      // Should remain at root level
      expect(storeResult.current.nodes[rootId].parentId).toBeNull();
    });
  });

  describe('Escape - Clear Selection or Exit Focus', () => {
    it('should clear selection when no focus mode', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Node' });
        storeResult.current.selectNode(node.id);
      });

      expect(storeResult.current.currentSession.selectedNodeIds).toHaveLength(1);

      dispatchKey('Escape');

      expect(storeResult.current.currentSession.selectedNodeIds).toEqual([]);
    });

    it('should exit focus mode when focused', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      let nodeId: string;

      act(() => {
        const node = storeResult.current.createNode(null, { title: 'Node' });
        nodeId = node.id;
        storeResult.current.zoomIn(nodeId);
      });

      expect(storeResult.current.currentSession.focusedNodeId).toBe(nodeId);

      dispatchKey('Escape');

      expect(storeResult.current.currentSession.focusedNodeId).toBeUndefined();
    });
  });

  describe('Ctrl+A / Cmd+A - Select All', () => {
    it('should select all nodes with Ctrl+A', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      act(() => {
        storeResult.current.createNode(null, { title: 'Node 1' });
        storeResult.current.createNode(null, { title: 'Node 2' });
        storeResult.current.createNode(null, { title: 'Node 3' });
      });

      dispatchKey('a', { ctrlKey: true });

      expect(storeResult.current.currentSession.selectedNodeIds).toHaveLength(3);
    });

    it('should select all nodes with Cmd+A (Mac)', () => {
      const { result: storeResult } = renderHook(() => useStore());
      renderHook(() => useKeyboardNav());

      act(() => {
        storeResult.current.createNode(null, { title: 'Node 1' });
        storeResult.current.createNode(null, { title: 'Node 2' });
      });

      dispatchKey('a', { metaKey: true });

      expect(storeResult.current.currentSession.selectedNodeIds).toHaveLength(2);
    });
  });
});
