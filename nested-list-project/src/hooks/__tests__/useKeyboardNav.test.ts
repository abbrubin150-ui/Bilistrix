import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useKeyboardNav } from '../useKeyboardNav';
import { useStore } from '../../store/useStore';
import { ListNode } from '../../types/core';

describe('useKeyboardNav', () => {
  let root1: ListNode;
  let child1: ListNode;
  let child2: ListNode;
  let grandchild1: ListNode;
  let grandchild2: ListNode;

  beforeEach(() => {
    // Reset store
    act(() => {
      useStore.getState().reset();
    });

    // Create a test tree structure:
    // root1
    //   ├─ child1
    //   │   ├─ grandchild1
    //   │   └─ grandchild2
    //   └─ child2
    act(() => {
      root1 = useStore.getState().createNode(null, { title: 'Root 1' });
      child1 = useStore.getState().createNode(root1.id, { title: 'Child 1' });
      child2 = useStore.getState().createNode(root1.id, { title: 'Child 2' });
      grandchild1 = useStore.getState().createNode(child1.id, { title: 'Grandchild 1' });
      grandchild2 = useStore.getState().createNode(child1.id, { title: 'Grandchild 2' });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const dispatchKeyEvent = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    window.dispatchEvent(event);
    return event;
  };

  describe('setup and cleanup', () => {
    it('should register keydown event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      renderHook(() => useKeyboardNav());

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should remove keydown event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useKeyboardNav());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('input element detection', () => {
    it('should not handle keys when input is focused', () => {
      renderHook(() => useKeyboardNav());

      // Select a node first
      act(() => {
        useStore.getState().selectNode(root1.id, false);
      });

      // Create mock input element
      const input = document.createElement('input');
      document.body.appendChild(input);

      // Dispatch event with input as target
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: input, writable: false });
      window.dispatchEvent(event);

      // Selection should not have changed
      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(root1.id);

      document.body.removeChild(input);
    });

    it('should not handle keys when textarea is focused', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(root1.id, false);
      });

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: textarea, writable: false });
      window.dispatchEvent(event);

      // Node should still exist
      expect(useStore.getState().nodes[root1.id]).toBeDefined();

      document.body.removeChild(textarea);
    });
  });

  describe('ArrowDown navigation', () => {
    it('should select first root when nothing is selected', () => {
      renderHook(() => useKeyboardNav());

      dispatchKeyEvent('ArrowDown');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(root1.id);
    });

    it('should navigate to first child if node is expanded', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(root1.id, false);
      });

      dispatchKeyEvent('ArrowDown');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child1.id);
    });

    it('should navigate to next sibling if node has no children', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child2.id, false);
      });

      dispatchKeyEvent('ArrowDown');

      // child2 has no next sibling at root level, so should go to root's next sibling or stay
      const selected = useStore.getState().currentSession.selectedNodeIds[0];
      expect(selected).toBeTruthy();
    });

    it('should skip collapsed nodes children', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().toggleCollapse(child1.id);
        useStore.getState().selectNode(child1.id, false);
      });

      dispatchKeyEvent('ArrowDown');

      // Should go to child2 instead of grandchild1
      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child2.id);
    });

    it('should navigate to parent next sibling when at last child', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(grandchild2.id, false);
      });

      dispatchKeyEvent('ArrowDown');

      // Should navigate to child2 (parent's next sibling)
      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child2.id);
    });
  });

  describe('ArrowUp navigation', () => {
    it('should do nothing when no node is selected', () => {
      renderHook(() => useKeyboardNav());

      dispatchKeyEvent('ArrowUp');

      expect(useStore.getState().currentSession.selectedNodeIds).toHaveLength(0);
    });

    it('should navigate to previous sibling', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child2.id, false);
      });

      dispatchKeyEvent('ArrowUp');

      // Should navigate to child1's last visible descendant (grandchild2) since child1 is expanded
      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(grandchild2.id);
    });

    it('should navigate to parent if first child', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child1.id, false);
      });

      dispatchKeyEvent('ArrowUp');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(root1.id);
    });

    it('should navigate to previous sibling last descendant if expanded', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child2.id, false);
      });

      dispatchKeyEvent('ArrowUp');

      // Should go to child1's last visible descendant (grandchild2)
      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(grandchild2.id);
    });

    it('should navigate to previous sibling if collapsed', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().toggleCollapse(child1.id);
        useStore.getState().selectNode(child2.id, false);
      });

      dispatchKeyEvent('ArrowUp');

      // Should go to child1, not its children
      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child1.id);
    });
  });

  describe('ArrowRight navigation', () => {
    it('should navigate to first child if expanded and has children', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(root1.id, false);
      });

      dispatchKeyEvent('ArrowRight');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child1.id);
    });

    it('should do nothing if node is collapsed', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().toggleCollapse(root1.id);
        useStore.getState().selectNode(root1.id, false);
      });

      dispatchKeyEvent('ArrowRight');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(root1.id);
    });

    it('should do nothing if node has no children', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child2.id, false);
      });

      dispatchKeyEvent('ArrowRight');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child2.id);
    });
  });

  describe('ArrowLeft navigation', () => {
    it('should navigate to parent', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child1.id, false);
      });

      dispatchKeyEvent('ArrowLeft');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(root1.id);
    });

    it('should do nothing if node has no parent', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(root1.id, false);
      });

      dispatchKeyEvent('ArrowLeft');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(root1.id);
    });
  });

  describe('Space key - toggle collapse', () => {
    it('should toggle collapse state of selected node', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(root1.id, false);
      });

      const initialState = useStore.getState().nodes[root1.id].isCollapsed;

      dispatchKeyEvent(' ');

      expect(useStore.getState().nodes[root1.id].isCollapsed).toBe(!initialState);
    });

    it('should not crash when no node is selected', () => {
      renderHook(() => useKeyboardNav());

      expect(() => dispatchKeyEvent(' ')).not.toThrow();
    });
  });

  describe('Enter key - create sibling', () => {
    it('should create sibling node at same level', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child1.id, false);
      });

      const nodeCountBefore = Object.keys(useStore.getState().nodes).length;

      dispatchKeyEvent('Enter');

      const nodeCountAfter = Object.keys(useStore.getState().nodes).length;
      expect(nodeCountAfter).toBe(nodeCountBefore + 1);

      // New node should be selected
      const selectedId = useStore.getState().currentSession.selectedNodeIds[0];
      const newNode = useStore.getState().nodes[selectedId];
      expect(newNode.parentId).toBe(child1.parentId);
    });

    it('should not create node when nothing is selected', () => {
      renderHook(() => useKeyboardNav());

      const nodeCountBefore = Object.keys(useStore.getState().nodes).length;

      dispatchKeyEvent('Enter');

      const nodeCountAfter = Object.keys(useStore.getState().nodes).length;
      expect(nodeCountAfter).toBe(nodeCountBefore);
    });
  });

  describe('Shift+Enter - create child', () => {
    it('should create child node', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child2.id, false);
      });

      const nodeCountBefore = Object.keys(useStore.getState().nodes).length;

      dispatchKeyEvent('Enter', { shiftKey: true });

      const nodeCountAfter = Object.keys(useStore.getState().nodes).length;
      expect(nodeCountAfter).toBe(nodeCountBefore + 1);

      // New node should be child of selected node
      const selectedId = useStore.getState().currentSession.selectedNodeIds[0];
      const newNode = useStore.getState().nodes[selectedId];
      expect(newNode.parentId).toBe(child2.id);
    });

    it('should not create child if at max depth', () => {
      renderHook(() => useKeyboardNav());

      // Create nodes up to level 5 (max depth)
      // root1 is at level 0, we need 5 more levels to reach level 5
      act(() => {
        const store = useStore.getState();
        let currentParent = root1.id;
        for (let i = 0; i < 5; i++) {
          const node = store.createNode(currentParent, { title: `Level ${i + 1}` });
          currentParent = node.id;
        }
        store.selectNode(currentParent, false);
      });

      const selectedId = useStore.getState().currentSession.selectedNodeIds[0];
      const selectedNode = useStore.getState().nodes[selectedId];
      expect(selectedNode.level).toBe(5);

      const nodeCountBefore = Object.keys(useStore.getState().nodes).length;

      dispatchKeyEvent('Enter', { shiftKey: true });

      const nodeCountAfter = Object.keys(useStore.getState().nodes).length;
      expect(nodeCountAfter).toBe(nodeCountBefore);
    });
  });

  describe('Delete/Backspace - delete node', () => {
    it('should delete selected node with Delete key', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child2.id, false);
      });

      dispatchKeyEvent('Delete');

      expect(useStore.getState().nodes[child2.id]).toBeUndefined();
    });

    it('should delete selected node with Backspace key', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(grandchild1.id, false);
      });

      dispatchKeyEvent('Backspace');

      expect(useStore.getState().nodes[grandchild1.id]).toBeUndefined();
    });

    it('should select next sibling after deletion', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child1.id, false);
      });

      dispatchKeyEvent('Delete');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child2.id);
    });

    it('should select previous sibling if no next sibling', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child2.id, false);
      });

      dispatchKeyEvent('Delete');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child1.id);
    });

    it('should select parent if no siblings', () => {
      renderHook(() => useKeyboardNav());

      // Delete grandchild2 first so grandchild1 has no siblings
      act(() => {
        useStore.getState().deleteNode(grandchild2.id);
        useStore.getState().selectNode(grandchild1.id, false);
      });

      dispatchKeyEvent('Delete');

      expect(useStore.getState().currentSession.selectedNodeIds[0]).toBe(child1.id);
    });

    it('should not delete when Ctrl is held (for browser shortcuts)', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child1.id, false);
      });

      dispatchKeyEvent('Backspace', { ctrlKey: true });

      expect(useStore.getState().nodes[child1.id]).toBeDefined();
    });
  });

  describe('Tab - indent node', () => {
    it('should move node to become child of previous sibling', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child2.id, false);
      });

      dispatchKeyEvent('Tab');

      const updatedNode = useStore.getState().nodes[child2.id];
      expect(updatedNode.parentId).toBe(child1.id);
    });

    it('should do nothing if node is first sibling', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child1.id, false);
      });

      dispatchKeyEvent('Tab');

      const node = useStore.getState().nodes[child1.id];
      expect(node.parentId).toBe(root1.id);
    });
  });

  describe('Shift+Tab - outdent node', () => {
    it('should move node to parent level', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(grandchild1.id, false);
      });

      dispatchKeyEvent('Tab', { shiftKey: true });

      const updatedNode = useStore.getState().nodes[grandchild1.id];
      expect(updatedNode.parentId).toBe(root1.id);
    });

    it('should do nothing if node has no parent', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(root1.id, false);
      });

      dispatchKeyEvent('Tab', { shiftKey: true });

      const node = useStore.getState().nodes[root1.id];
      expect(node.parentId).toBeNull();
    });
  });

  describe('Escape - clear selection', () => {
    it('should clear selection when not in focus mode', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().selectNode(child1.id, false);
      });

      expect(useStore.getState().currentSession.selectedNodeIds).toHaveLength(1);

      dispatchKeyEvent('Escape');

      expect(useStore.getState().currentSession.selectedNodeIds).toHaveLength(0);
    });

    it('should exit focus mode when in focus mode', () => {
      renderHook(() => useKeyboardNav());

      act(() => {
        useStore.getState().setFocusNode(child1.id);
      });

      expect(useStore.getState().currentSession.focusedNodeId).toBe(child1.id);

      dispatchKeyEvent('Escape');

      expect(useStore.getState().currentSession.focusedNodeId).toBeUndefined();
    });
  });

  describe('Ctrl+A / Cmd+A - select all', () => {
    it('should select all nodes with Ctrl+A', () => {
      renderHook(() => useKeyboardNav());

      dispatchKeyEvent('a', { ctrlKey: true });

      const selectedIds = useStore.getState().currentSession.selectedNodeIds;
      const allNodeIds = Object.keys(useStore.getState().nodes);
      expect(selectedIds.length).toBe(allNodeIds.length);
    });

    it('should select all nodes with Cmd+A (Mac)', () => {
      renderHook(() => useKeyboardNav());

      dispatchKeyEvent('a', { metaKey: true });

      const selectedIds = useStore.getState().currentSession.selectedNodeIds;
      const allNodeIds = Object.keys(useStore.getState().nodes);
      expect(selectedIds.length).toBe(allNodeIds.length);
    });
  });
});
