import React, { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useToastStore } from '../../store/useToastStore';
import { VIEW_MODE_LABELS } from '../../constants/config';
import { ViewMode } from '../../types/core';
import { RulesEngine } from './RulesEngine';
import { PluginsManager } from './PluginsManager';
import { ThemeSwitcher } from './ThemeSwitcher';

export const Toolbar: React.FC = () => {
  const createNode = useStore((state) => state.createNode);
  const setViewMode = useStore((state) => state.setViewMode);
  const setRTL = useStore((state) => state.setRTL);
  const collapseAll = useStore((state) => state.collapseAll);
  const expandAll = useStore((state) => state.expandAll);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);
  const createSnapshot = useStore((state) => state.createSnapshot);
  const toggleCommandPalette = useStore((state) => state.toggleCommandPalette);

  const viewMode = useStore((state) => state.currentSession.viewMode);
  const rtl = useStore((state) => state.currentSession.rtl);
  const theme = useStore((state) => state.currentSession.theme);
  const historyPast = useStore((state) => state.history.past);
  const historyFuture = useStore((state) => state.history.future);
  const addToast = useToastStore((state) => state.addToast);

  const [showRulesEngine, setShowRulesEngine] = useState(false);
  const [showPluginsManager, setShowPluginsManager] = useState(false);
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddRoot = () => {
    createNode(null);
    // Focus will be handled by ListItem
  };

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nested-list-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(
        rtl ? 'ייצוא הושלם בהצלחה' : 'Export completed successfully',
        'success'
      );
    } catch (error) {
      console.error('Export failed:', error);
      addToast(rtl ? 'ייצוא נכשל' : 'Export failed. Please try again.', 'error');
    }
  };

  const handleSnapshot = () => {
    const name = prompt(rtl ? 'שם ה-Snapshot:' : 'Snapshot name:');
    if (name) {
      createSnapshot(name);
      alert(rtl ? 'Snapshot נשמר!' : 'Snapshot saved!');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        if (data) {
          try {
            importData(data);
            addToast(rtl ? 'ייבוא הושלם בהצלחה' : 'Import completed successfully', 'success');
          } catch (error) {
            console.error('Import failed:', error);
            addToast(rtl ? 'ייבוא נכשל' : 'Import failed. Please check the file.', 'error');
          }
        }
      };
      reader.readAsText(file);
    }

    // Allow selecting the same file again
    event.target.value = '';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px 20px',
        background: `${theme.colors.primary}10`,
        borderRadius: '12px',
        marginBottom: '24px',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Add Root Button */}
      <button
        onClick={handleAddRoot}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: `2px solid ${theme.colors.primary}`,
          background: `${theme.colors.primary}20`,
          color: theme.colors.primary,
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${theme.colors.primary}30`;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${theme.colors.primary}20`;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        + {rtl ? 'הוסף פריט חדש' : 'Add New Item'}
      </button>

      {/* View Mode Selector */}
      <select
        value={viewMode}
        onChange={(e) => setViewMode(e.target.value as ViewMode)}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        {Object.entries(VIEW_MODE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* RTL Toggle */}
      <button
        onClick={() => setRTL(!rtl)}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
        title={rtl ? 'החלף ל-LTR' : 'Switch to RTL'}
      >
        {rtl ? '⬅️ RTL' : 'LTR ➡️'}
      </button>

      {/* Collapse/Expand */}
      <button
        onClick={collapseAll}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        {rtl ? '🔽 כווץ הכל' : '🔽 Collapse All'}
      </button>

      <button
        onClick={expandAll}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        {rtl ? '🔼 הרחב הכל' : '🔼 Expand All'}
      </button>

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={historyPast.length === 0}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: historyPast.length === 0 ? 'not-allowed' : 'pointer',
          opacity: historyPast.length === 0 ? 0.5 : 1,
        }}
        title="Ctrl+Z"
      >
        ↶ {rtl ? 'בטל' : 'Undo'}
      </button>

      <button
        onClick={redo}
        disabled={historyFuture.length === 0}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: historyFuture.length === 0 ? 'not-allowed' : 'pointer',
          opacity: historyFuture.length === 0 ? 0.5 : 1,
        }}
        title="Ctrl+Shift+Z"
      >
        ↷ {rtl ? 'חזור' : 'Redo'}
      </button>

      {/* Command Palette */}
      <button
        onClick={toggleCommandPalette}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
          fontWeight: '600',
        }}
        title="Ctrl+K"
      >
        ⌘ {rtl ? 'פקודות' : 'Commands'}
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        💾 {rtl ? 'ייצוא' : 'Export'}
      </button>

      {/* Import */}
      <button
        onClick={handleImportClick}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        📂 {rtl ? 'ייבוא' : 'Import'}
      </button>

      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Snapshot */}
      <button
        onClick={handleSnapshot}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        📸 {rtl ? 'Snapshot' : 'Snapshot'}
      </button>

      {/* Divider */}
      <div
        style={{
          width: '2px',
          background: theme.colors.border,
          margin: '0 8px',
        }}
      />

      {/* Theme Switcher */}
      <button
        onClick={() => setShowThemeSwitcher(true)}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
        title={rtl ? 'החלף ערכת נושא' : 'Change theme'}
      >
        🎨 {rtl ? 'ערכת נושא' : 'Theme'}
      </button>

      {/* Rules Engine */}
      <button
        onClick={() => setShowRulesEngine(true)}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
        title={rtl ? 'מנגנון חוקים' : 'Rules engine'}
      >
        ⚙️ {rtl ? 'חוקים' : 'Rules'}
      </button>

      {/* Plugins Manager */}
      <button
        onClick={() => setShowPluginsManager(true)}
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.1)',
          color: theme.colors.text,
          fontSize: '14px',
          cursor: 'pointer',
        }}
        title={rtl ? 'מנהל תוספים' : 'Plugins manager'}
      >
        🧩 {rtl ? 'תוספים' : 'Plugins'}
      </button>

      {/* Modals */}
      {showRulesEngine && <RulesEngine onClose={() => setShowRulesEngine(false)} />}
      {showPluginsManager && <PluginsManager onClose={() => setShowPluginsManager(false)} />}
      {showThemeSwitcher && <ThemeSwitcher onClose={() => setShowThemeSwitcher(false)} />}
    </div>
  );
};
