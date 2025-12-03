import React, { useEffect } from 'react';
import { Header } from './components/ui/Header';
import { Toolbar } from './components/ui/Toolbar';
import { SearchFilter } from './components/ui/SearchFilter';
import { ListView } from './components/core/ListView';
import { CommandPalette } from './components/ui/CommandPalette';
import { SidePanel } from './components/ui/SidePanel';
import { useStore } from './store/useStore';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { APP_CONFIG } from './constants/config';

function App() {
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const importData = useStore((state) => state.importData);

  // Enable keyboard navigation
  useKeyboardNav();

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    if (savedData) {
      try {
        importData(savedData);
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, [importData]);

  // Auto-save to localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const data = useStore.getState().exportData();
      localStorage.setItem(APP_CONFIG.STORAGE_KEY, data);
    }, APP_CONFIG.AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

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
        const data = state.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nested-list-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
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
            importData(data);
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
  }, [importData]);

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
        <Toolbar />
        <SearchFilter />
        <ListView />
      </div>

      <CommandPalette />
      <SidePanel />

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
