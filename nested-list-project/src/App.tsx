import React, { useEffect } from 'react';
import { Header } from './components/ui/Header';
import { Toolbar } from './components/ui/Toolbar';
import { SearchFilter } from './components/ui/SearchFilter';
import { ListView } from './components/core/ListView';
import { CommandPalette } from './components/ui/CommandPalette';
import { SidePanel } from './components/ui/SidePanel';
import { StatusBadge } from './components/ui/StatusBadge';
import { ToastContainer } from './components/ui/Toast';
import { useStore } from './store/useStore';
import { useToastStore } from './store/useToastStore';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { APP_CONFIG } from './constants/config';

function App() {
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const importData = useStore((state) => state.importData);
  const addToast = useToastStore((state) => state.addToast);
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);
  const { isSaving, lastSavedAt, hasPendingChanges } = useAutoSave();

  // Enable keyboard navigation
  useKeyboardNav();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
      if (savedData) {
        importData(savedData);
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to load saved data from storage.';
      addToast(
        rtl ? `טעינת נתונים שמורים נכשלה: ${message}` : message,
        'error'
      );
    }
  }, [addToast, importData, rtl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useStore.getState();

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        state.undo();
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        state.redo();
      }

      // Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        try {
          const data = state.exportData();
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nested-list-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Export failed:', error);
          addToast(
            rtl ? 'ייצוא נכשל' : 'Export failed. Please try again.',
            'error'
          );
        }
      }

      // Focus mode exit
      if (e.key === 'Escape' && state.currentSession.focusedNodeId) {
        e.preventDefault();
        state.zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Drag and drop file import
  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          if (data) {
            try {
              importData(data);
            } catch (error) {
              console.error('Import failed:', error);
              const message =
                error instanceof Error && error.message
                  ? error.message
                  : rtl
                  ? 'ייבוא נכשל'
                  : 'Import failed. Please check the file.';
              addToast(message, 'error');
            }
          }
        };
        reader.readAsText(file);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);

    return () => {
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, [addToast, importData, rtl]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.background,
        padding: '40px 20px',
        fontFamily: "'Segoe UI', Tahoma, 'Heebo', sans-serif",
        direction: rtl ? 'rtl' : 'ltr',
        color: theme.colors.text,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <StatusBadge
            isSaving={isSaving}
            hasPendingChanges={hasPendingChanges}
            lastSavedAt={lastSavedAt}
          />
        </div>
        <Toolbar />
        <SearchFilter />
        <ListView />
      </div>

      <CommandPalette />
      <SidePanel />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} rtl={rtl} />

      {/* Footer */}
      <footer
        style={{
          marginTop: '60px',
          textAlign: 'center',
          color: theme.colors.text,
          opacity: 0.5,
          fontSize: '13px',
          padding: '20px',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          {rtl
            ? '🎨 אפליקציית Sandbox עם רשימות מקוננות'
            : '🎨 Nested List Sandbox App'}
        </div>
        <div>
          {rtl
            ? '⌨️ קיצורי דרך: Ctrl+K (פקודות) | Ctrl+Z (בטל) | Ctrl+Shift+Z (חזור) | Ctrl+E (ייצוא)'
            : '⌨️ Shortcuts: Ctrl+K (Commands) | Ctrl+Z (Undo) | Ctrl+Shift+Z (Redo) | Ctrl+E (Export)'}
        </div>
      </footer>
    </div>
  );
}

export default App;
