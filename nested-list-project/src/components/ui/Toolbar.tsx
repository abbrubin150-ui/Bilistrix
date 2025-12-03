import React from 'react';
import { useStore } from '../../store/useStore';
import { VIEW_MODE_LABELS } from '../../constants/config';
import { ViewMode } from '../../types/core';

export const Toolbar: React.FC = () => {
  const createNode = useStore((state) => state.createNode);
  const setViewMode = useStore((state) => state.setViewMode);
  const setRTL = useStore((state) => state.setRTL);
  const collapseAll = useStore((state) => state.collapseAll);
  const expandAll = useStore((state) => state.expandAll);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const exportData = useStore((state) => state.exportData);
  const createSnapshot = useStore((state) => state.createSnapshot);
  const toggleCommandPalette = useStore((state) => state.toggleCommandPalette);

  const viewMode = useStore((state) => state.currentSession.viewMode);
  const rtl = useStore((state) => state.currentSession.rtl);
  const theme = useStore((state) => state.currentSession.theme);
  const historyPast = useStore((state) => state.history.past);
  const historyFuture = useStore((state) => state.history.future);

  const handleAddRoot = () => {
    const newNode = createNode(null);
    // Focus will be handled by ListItem
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nested-list-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSnapshot = () => {
    const name = prompt(rtl ? 'שם ה-Snapshot:' : 'Snapshot name:');
    if (name) {
      createSnapshot(name);
      alert(rtl ? 'Snapshot נשמר!' : 'Snapshot saved!');
    }
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
    </div>
  );
};
