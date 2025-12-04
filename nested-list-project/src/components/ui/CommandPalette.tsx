import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { ViewMode } from '../../types/core';
import { VIEW_MODE_LABELS } from '../../constants/config';

interface Command {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  category: string;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useStore((state) => state.commandPaletteOpen);
  const closeCommandPalette = useStore((state) => state.closeCommandPalette);
  const setViewMode = useStore((state) => state.setViewMode);
  const createNode = useStore((state) => state.createNode);
  const collapseAll = useStore((state) => state.collapseAll);
  const expandAll = useStore((state) => state.expandAll);
  const createSnapshot = useStore((state) => state.createSnapshot);
  const exportData = useStore((state) => state.exportData);
  const setRTL = useStore((state) => state.setRTL);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(() => [
    // View modes
    ...Object.entries(VIEW_MODE_LABELS).map(([key, label]) => ({
      id: `view-${key}`,
      label: `${rtl ? 'תצוגה' : 'View'}: ${label}`,
      description: rtl ? `החלף למצב ${label}` : `Switch to ${label} mode`,
      action: () => {
        setViewMode(key as ViewMode);
        closeCommandPalette();
      },
      category: rtl ? 'תצוגה' : 'View',
    })),

    // Node actions
    {
      id: 'add-node',
      label: rtl ? 'הוסף פריט חדש' : 'Add New Item',
      description: rtl ? 'צור פריט ראשי חדש' : 'Create a new root item',
      action: () => {
        createNode(null);
        closeCommandPalette();
      },
      category: rtl ? 'פעולות' : 'Actions',
    },
    {
      id: 'collapse-all',
      label: rtl ? 'כווץ הכל' : 'Collapse All',
      description: rtl ? 'כווץ את כל הפריטים' : 'Collapse all items',
      action: () => {
        collapseAll();
        closeCommandPalette();
      },
      category: rtl ? 'פעולות' : 'Actions',
    },
    {
      id: 'expand-all',
      label: rtl ? 'הרחב הכל' : 'Expand All',
      description: rtl ? 'הרחב את כל הפריטים' : 'Expand all items',
      action: () => {
        expandAll();
        closeCommandPalette();
      },
      category: rtl ? 'פעולות' : 'Actions',
    },

    // Snapshots
    {
      id: 'create-snapshot',
      label: rtl ? 'צור Snapshot' : 'Create Snapshot',
      description: rtl ? 'שמור מצב נוכחי' : 'Save current state',
      action: () => {
        const name = prompt(rtl ? 'שם ה-Snapshot:' : 'Snapshot name:');
        if (name) {
          createSnapshot(name);
        }
        closeCommandPalette();
      },
      category: rtl ? 'ניהול' : 'Management',
    },

    // Export
    {
      id: 'export',
      label: rtl ? 'ייצא נתונים' : 'Export Data',
      description: rtl ? 'ייצא את הנתונים לקובץ JSON' : 'Export data to JSON file',
      action: () => {
        const data = exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nested-list-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        closeCommandPalette();
      },
      category: rtl ? 'ניהול' : 'Management',
    },

    // RTL Toggle
    {
      id: 'toggle-rtl',
      label: rtl ? 'החלף לכיוון LTR' : 'Switch to RTL',
      description: rtl ? 'שנה את כיוון הטקסט' : 'Change text direction',
      action: () => {
        setRTL(!rtl);
        closeCommandPalette();
      },
      category: rtl ? 'הגדרות' : 'Settings',
    },
  ], [rtl, setViewMode, closeCommandPalette, createNode, collapseAll, expandAll, createSnapshot, exportData, setRTL]);

  const filteredCommands = useMemo(() => commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
  ), [commands, searchQuery]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          useStore.getState().toggleCommandPalette();
        }
        return;
      }

      if (e.key === 'Escape') {
        closeCommandPalette();
        setSearchQuery('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, closeCommandPalette]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '100px 20px',
      }}
      onClick={closeCommandPalette}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: theme.mode === 'dark' ? '#1a1a2e' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          direction: rtl ? 'rtl' : 'ltr',
        }}
      >
        {/* Search Input */}
        <div style={{ padding: '16px' }}>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={rtl ? 'חפש פקודה...' : 'Search commands...'}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: theme.colors.text,
              borderRadius: '8px',
              outline: 'none',
              direction: rtl ? 'rtl' : 'ltr',
            }}
          />
        </div>

        {/* Commands List */}
        <div
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {filteredCommands.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: theme.colors.text,
                opacity: 0.5,
              }}
            >
              {rtl ? 'לא נמצאו פקודות' : 'No commands found'}
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onClick={cmd.action}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background:
                    index === selectedIndex
                      ? `${theme.colors.primary}30`
                      : 'transparent',
                  borderLeft:
                    index === selectedIndex
                      ? `3px solid ${theme.colors.primary}`
                      : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div
                  style={{
                    color: theme.colors.text,
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                  }}
                >
                  {cmd.label}
                </div>
                {cmd.description && (
                  <div
                    style={{
                      color: theme.colors.text,
                      opacity: 0.6,
                      fontSize: '12px',
                    }}
                  >
                    {cmd.description}
                  </div>
                )}
                <div
                  style={{
                    color: theme.colors.primary,
                    fontSize: '11px',
                    marginTop: '4px',
                    opacity: 0.8,
                  }}
                >
                  {cmd.category}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.05)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: theme.colors.text,
            opacity: 0.6,
          }}
        >
          <span>↑↓ {rtl ? 'ניווט' : 'Navigate'}</span>
          <span>↵ {rtl ? 'בחר' : 'Select'}</span>
          <span>Esc {rtl ? 'סגור' : 'Close'}</span>
        </div>
      </div>
    </div>
  );
};
