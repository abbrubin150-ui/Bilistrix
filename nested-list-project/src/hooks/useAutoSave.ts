import { useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../constants/config';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';

export const useAutoSave = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  const rtl = useStore((state) => state.currentSession.rtl);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleSave = () => {
      setHasPendingChanges(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsSaving(true);
        try {
          const data = useStore.getState().exportData();
          localStorage.setItem(APP_CONFIG.STORAGE_KEY, data);
          setLastSavedAt(Date.now());
          setHasPendingChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
          addToast(
            rtl ? 'שמירה אוטומטית נכשלה' : 'Auto-save failed. Please try again.',
            'error'
          );
        } finally {
          setIsSaving(false);
        }
      }, APP_CONFIG.AUTO_SAVE_INTERVAL);
    };

    const unsubscribe = useStore.subscribe(scheduleSave);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      unsubscribe();
    };
  }, [addToast, rtl]);

  return { isSaving, lastSavedAt, hasPendingChanges };
};
