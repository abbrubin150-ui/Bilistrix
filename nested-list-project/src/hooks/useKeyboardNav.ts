import { useEffect } from 'react';
import { useStore } from '../store/useStore';

/**
 * Hook for advanced keyboard navigation
 */
export const useKeyboardNav = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useStore.getState();
      const {
        nodes,
        rootNodeIds,
        currentSession: { selectedNodeIds, focusedNodeId },
        selectNode,
        createNode,
        deleteNode,
        toggleCollapse,
        moveNode,
        clearSelection,
      } = state;

      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const selectedId = selectedNodeIds[0];
      const currentNode = selectedId ? nodes[selectedId] : null;

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateDown();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateUp();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentNode && !currentNode.isCollapsed && currentNode.childrenIds.length > 0) {
          // Move to first child
          selectNode(currentNode.childrenIds[0], false);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentNode?.parentId) {
          // Move to parent
          selectNode(currentNode.parentId, false);
        }
      }

      // Space to toggle collapse
      else if (e.key === ' ' && currentNode) {
        e.preventDefault();
        toggleCollapse(currentNode.id);
      }

      // Enter to create sibling
      else if (e.key === 'Enter' && !e.shiftKey && currentNode) {
        e.preventDefault();
        const newNode = createNode(currentNode.parentId);
        if (newNode) {
          selectNode(newNode.id, false);
        }
      }

      // Shift+Enter to create child
      else if (e.key === 'Enter' && e.shiftKey && currentNode) {
        e.preventDefault();
        if (currentNode.level < 5) {
          const newNode = createNode(currentNode.id);
          if (newNode) {
            selectNode(newNode.id, false);
          }
        }
      }

      // Delete/Backspace to delete
      else if ((e.key === 'Delete' || e.key === 'Backspace') && currentNode && !e.ctrlKey) {
        e.preventDefault();
        const parent = currentNode.parentId ? nodes[currentNode.parentId] : null;
        const siblings = parent
          ? parent.childrenIds
          : rootNodeIds;
        const currentIndex = siblings.indexOf(currentNode.id);

        deleteNode(currentNode.id);

        // Select next/previous sibling or parent
        if (siblings.length > 1) {
          if (currentIndex < siblings.length - 1) {
            selectNode(siblings[currentIndex + 1], false);
          } else if (currentIndex > 0) {
            selectNode(siblings[currentIndex - 1], false);
          }
        } else if (parent) {
          selectNode(parent.id, false);
        }
      }

      // Tab to indent (increase level)
      else if (e.key === 'Tab' && !e.shiftKey && currentNode) {
        e.preventDefault();
        const parent = currentNode.parentId ? nodes[currentNode.parentId] : null;
        const siblings = parent ? parent.childrenIds : rootNodeIds;
        const currentIndex = siblings.indexOf(currentNode.id);

        // Try to make it a child of the previous sibling
        if (currentIndex > 0) {
          const prevSiblingId = siblings[currentIndex - 1];
          moveNode(currentNode.id, prevSiblingId);
        }
      }

      // Shift+Tab to outdent (decrease level)
      else if (e.key === 'Tab' && e.shiftKey && currentNode && currentNode.parentId) {
        e.preventDefault();
        const parent = nodes[currentNode.parentId];
        if (parent) {
          moveNode(currentNode.id, parent.parentId);
        }
      }

      // F2 to edit (handled by ListItem component)
      // Escape to clear selection or exit focus mode
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (focusedNodeId) {
          state.zoomOut();
        } else {
          clearSelection();
        }
      }

      // Ctrl+A to select all
      else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        state.selectAll();
      }

      function navigateDown() {
        if (!currentNode) {
          // Select first root
          if (rootNodeIds.length > 0) {
            selectNode(rootNodeIds[0], false);
          }
          return;
        }

        // If has children and expanded, go to first child
        if (!currentNode.isCollapsed && currentNode.childrenIds.length > 0) {
          selectNode(currentNode.childrenIds[0], false);
          return;
        }

        // Otherwise, go to next sibling
        const parent = currentNode.parentId ? nodes[currentNode.parentId] : null;
        const siblings = parent ? parent.childrenIds : rootNodeIds;
        const currentIndex = siblings.indexOf(currentNode.id);

        if (currentIndex < siblings.length - 1) {
          selectNode(siblings[currentIndex + 1], false);
          return;
        }

        // If no next sibling, go to parent's next sibling
        let ancestor = parent;
        while (ancestor) {
          const ancestorParent = ancestor.parentId
            ? nodes[ancestor.parentId]
            : null;
          const ancestorSiblings = ancestorParent
            ? ancestorParent.childrenIds
            : rootNodeIds;
          const ancestorIndex = ancestorSiblings.indexOf(ancestor.id);

          if (ancestorIndex < ancestorSiblings.length - 1) {
            selectNode(ancestorSiblings[ancestorIndex + 1], false);
            return;
          }

          ancestor = ancestorParent;
        }
      }

      function navigateUp() {
        if (!currentNode) return;

        const parent = currentNode.parentId ? nodes[currentNode.parentId] : null;
        const siblings = parent ? parent.childrenIds : rootNodeIds;
        const currentIndex = siblings.indexOf(currentNode.id);

        if (currentIndex > 0) {
          // Go to previous sibling's last visible descendant
          let prevId = siblings[currentIndex - 1];
          let prevNode = nodes[prevId];

          while (
            prevNode &&
            !prevNode.isCollapsed &&
            prevNode.childrenIds.length > 0
          ) {
            prevId = prevNode.childrenIds[prevNode.childrenIds.length - 1];
            prevNode = nodes[prevId];
          }

          selectNode(prevId, false);
        } else if (parent) {
          // Go to parent
          selectNode(parent.id, false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
