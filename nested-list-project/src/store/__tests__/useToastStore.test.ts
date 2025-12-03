import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToastStore } from '../useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useToastStore.getState().clear();
    });
  });

  describe('addToast', () => {
    it('should add a toast with default type', () => {
      const { result } = renderHook(() => useToastStore());

      let toastId: string;
      act(() => {
        toastId = result.current.addToast('Test message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        message: 'Test message',
        type: 'info',
      });
      expect(result.current.toasts[0].id).toBe(toastId!);
    });

    it('should add a toast with custom type', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast('Error message', 'error');
        result.current.addToast('Success message', 'success');
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts[0].type).toBe('error');
      expect(result.current.toasts[1].type).toBe('success');
    });

    it('should generate unique IDs for each toast', () => {
      const { result } = renderHook(() => useToastStore());

      let id1: string, id2: string, id3: string;
      act(() => {
        id1 = result.current.addToast('Message 1');
        id2 = result.current.addToast('Message 2');
        id3 = result.current.addToast('Message 3');
      });

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id3).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should add multiple toasts without removing previous ones', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast('First');
        result.current.addToast('Second');
        result.current.addToast('Third');
      });

      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].message).toBe('First');
      expect(result.current.toasts[1].message).toBe('Second');
      expect(result.current.toasts[2].message).toBe('Third');
    });

    it('should return the toast ID', () => {
      const { result } = renderHook(() => useToastStore());

      let returnedId: string;
      act(() => {
        returnedId = result.current.addToast('Test');
      });

      expect(returnedId!).toBeTruthy();
      expect(result.current.toasts[0].id).toBe(returnedId!);
    });
  });

  describe('dismissToast', () => {
    it('should remove a specific toast by ID', () => {
      const { result } = renderHook(() => useToastStore());

      let id1: string, id2: string, id3: string;
      act(() => {
        id1 = result.current.addToast('First');
        id2 = result.current.addToast('Second');
        id3 = result.current.addToast('Third');
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.dismissToast(id2);
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts[0].id).toBe(id1);
      expect(result.current.toasts[1].id).toBe(id3);
    });

    it('should do nothing when dismissing non-existent toast', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast('Test');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismissToast('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should remove the last remaining toast', () => {
      const { result } = renderHook(() => useToastStore());

      let id: string;
      act(() => {
        id = result.current.addToast('Only toast');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismissToast(id);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should remove all toasts', () => {
      const { result } = renderHook(() => useToastStore());

      act(() => {
        result.current.addToast('First');
        result.current.addToast('Second', 'error');
        result.current.addToast('Third', 'success');
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.clear();
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should work when there are no toasts', () => {
      const { result } = renderHook(() => useToastStore());

      expect(result.current.toasts).toHaveLength(0);

      act(() => {
        result.current.clear();
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('toast ID format', () => {
    it('should generate IDs in expected format (timestamp-random)', () => {
      const { result } = renderHook(() => useToastStore());

      let id: string;
      act(() => {
        id = result.current.addToast('Test');
      });

      // ID should match format: timestamp-randomnumber
      expect(id!).toMatch(/^\d+-0\.\d+$/);
    });
  });
});
