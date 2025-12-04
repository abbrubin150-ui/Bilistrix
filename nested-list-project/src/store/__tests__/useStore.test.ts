import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useStore } from '../useStore';
import { useToastStore } from '../useToastStore';
import { APP_CONFIG } from '../../constants/config';
import { useAutoSave } from '../../hooks/useAutoSave';
import { ListNode } from '../../types/core';

const resetStores = () => {
  act(() => {
    useStore.getState().reset();
    useToastStore.getState().clear();
  });
};

describe('useStore integration', () => {
  beforeEach(() => {
    resetStores();
  });

  describe('node CRUD flows', () => {
    it('creates nodes and clears focus/selection when deleting them', () => {
      const { result } = renderHook(() => useStore());

      let root!: ListNode;
      let child!: ListNode;
      act(() => {
        root = result.current.createNode(null, { title: 'Root' });
        child = result.current.createNode(root.id, { title: 'Child' });
        result.current.selectNode(child.id);
        result.current.setFocusNode(child.id);
      });

      expect(result.current.currentSession.selectedNodeIds).toContain(child.id);
      expect(result.current.currentSession.focusedNodeId).toBe(child.id);

      act(() => {
        result.current.deleteNode(child.id);
      });

      expect(result.current.nodes[child.id]).toBeUndefined();
      expect(result.current.nodes[root.id].childrenIds).not.toContain(child.id);
      expect(result.current.currentSession.selectedNodeIds).toHaveLength(0);
      expect(result.current.currentSession.focusedNodeId).toBeUndefined();
    });
  });

  describe('moving nodes respects depth limits', () => {
    it('prevents moves that would exceed the maximum depth', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useStore());

      let shallow!: ListNode;
      let deepChainParent!: ListNode;
      let movable!: ListNode;
      act(() => {
        shallow = result.current.createNode(null, { title: 'Shallow' });
        const a = result.current.createNode(null, { title: 'A' });
        const b = result.current.createNode(a.id, { title: 'B' });
        const c = result.current.createNode(b.id, { title: 'C' });
        const d = result.current.createNode(c.id, { title: 'D' });
        deepChainParent = result.current.createNode(d.id, { title: 'E' }); // level 5
        movable = result.current.createNode(shallow.id, { title: 'Movable' });
        result.current.createNode(movable.id, { title: 'Movable Child' });
      });

      act(() => {
        result.current.moveNode(movable.id, deepChainParent.id);
      });

      expect(result.current.nodes[movable.id].parentId).toBe(shallow.id);
      expect(result.current.nodes[deepChainParent.id].childrenIds).not.toContain(
        movable.id
      );
      expect(warnSpy).toHaveBeenCalledWith('Cannot move node: invalid move');
      warnSpy.mockRestore();
    });
  });

  describe('history undo/redo', () => {
    it('tracks past and future stacks across actions', () => {
      const { result } = renderHook(() => useStore());

      let root!: ListNode;
      let child!: ListNode;
      act(() => {
        root = result.current.createNode(null, { title: 'Root' });
        child = result.current.createNode(root.id, { title: 'Child' });
      });

      expect(result.current.history.past.length).toBe(2);

      act(() => {
        result.current.undo();
      });

      expect(result.current.history.past.length).toBe(1);
      expect(result.current.history.future.length).toBe(1);

      act(() => {
        result.current.undo();
      });

      expect(result.current.nodes[child.id]).toBeUndefined();
      expect(result.current.history.past.length).toBe(0);
      expect(result.current.history.future.length).toBe(2);

      act(() => {
        result.current.redo();
      });

      expect(result.current.history.past.length).toBe(1);
      expect(result.current.history.future.length).toBe(1);

      act(() => {
        result.current.redo();
      });

      expect(result.current.nodes[child.id]).toBeDefined();
      expect(result.current.history.future.length).toBe(0);
    });
  });

  describe('templates', () => {
    it('applies templates with nested children and records history', () => {
      const { result } = renderHook(() => useStore());

      let root!: ListNode;
      let child!: ListNode;
      let grandchild!: ListNode;
      act(() => {
        root = result.current.createNode(null, { title: 'Template Root' });
        child = result.current.createNode(root.id, { title: 'Child' });
        grandchild = result.current.createNode(child.id, { title: 'Grandchild' });
        result.current.createTemplate(root.id, 'Template', 'With children');
      });

      const templateId = Object.keys(result.current.templates)[0];
      const historyBefore = result.current.history.past.length;

      act(() => {
        result.current.applyTemplate(templateId, null);
      });

      const newRootId = result.current.rootNodeIds.find((id) => id !== root.id);
      expect(newRootId).toBeDefined();
      const clonedChildIds = result.current.nodes[newRootId!].childrenIds;
      expect(clonedChildIds).toHaveLength(1);
      const clonedGrandChildIds =
        result.current.nodes[clonedChildIds[0]].childrenIds;
      expect(clonedGrandChildIds).toHaveLength(1);

      expect(result.current.history.past.length).toBe(historyBefore + 1);
      expect(result.current.nodes[newRootId!].parentId).toBeNull();
      expect(result.current.nodes[grandchild.id]).toBeDefined();
    });
  });

  describe('snapshots', () => {
    it('restores snapshots and appends to history', () => {
      const { result } = renderHook(() => useStore());

      let node!: ListNode;
      act(() => {
        node = result.current.createNode(null, { title: 'Original' });
        result.current.createSnapshot('First', 'Baseline');
        result.current.updateNode(node.id, { title: 'Changed' });
      });

      const snapshotId = Object.keys(result.current.snapshots)[0];
      const pastBefore = result.current.history.past.length;

      act(() => {
        result.current.restoreSnapshot(snapshotId);
      });

      expect(result.current.nodes[node.id].title).toBe('Original');
      expect(result.current.history.past.length).toBe(pastBefore + 1);
      expect(result.current.history.future).toHaveLength(0);
    });
  });

  describe('export and auto-save safeguards', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('exports data with expected shape', () => {
      const { result } = renderHook(() => useStore());

      let node!: ListNode;
      act(() => {
        node = result.current.createNode(null, { title: 'Exported' });
      });

      const json = result.current.exportData();
      const parsed = JSON.parse(json);

      expect(parsed.nodes[node.id].title).toBe('Exported');
      expect(parsed.rootNodeIds).toContain(node.id);
      expect(parsed).toHaveProperty('session');
      expect(parsed).toHaveProperty('templates');
      expect(parsed).toHaveProperty('snapshots');
    });

    it('debounces auto-save and writes to localStorage once', () => {
      vi.useFakeTimers();
      const setItemSpy = vi.spyOn(window.localStorage, 'setItem');
      const { result } = renderHook(() => useAutoSave());

      act(() => {
        useStore.getState().createNode(null, { title: 'Auto Save' });
      });

      expect(result.current.hasPendingChanges).toBe(true);
      expect(setItemSpy).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(APP_CONFIG.AUTO_SAVE_INTERVAL - 1);
      });

      expect(setItemSpy).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(setItemSpy).toHaveBeenCalledTimes(1);
      expect(setItemSpy).toHaveBeenCalledWith(
        APP_CONFIG.STORAGE_KEY,
        expect.any(String)
      );
      expect(result.current.hasPendingChanges).toBe(false);
      expect(result.current.lastSavedAt).not.toBeNull();

      setItemSpy.mockRestore();
    });
  });
});
