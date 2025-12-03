import React, { useState, useRef, useEffect } from 'react';
import { ListNode } from '../../types/core';
import { useStore } from '../../store/useStore';

interface ListItemProps {
  nodeId: string;
  isSelected?: boolean;
  isDragging?: boolean;
  filteredNodeIds?: Set<string> | null;
}

export const ListItem: React.FC<ListItemProps> = ({
  nodeId,
  isSelected = false,
  isDragging = false,
  filteredNodeIds = null,
}) => {
  const node = useStore((state) => state.nodes[nodeId]);
  const updateNode = useStore((state) => state.updateNode);
  const deleteNode = useStore((state) => state.deleteNode);
  const createNode = useStore((state) => state.createNode);
  const toggleCollapse = useStore((state) => state.toggleCollapse);
  const toggleDone = useStore((state) => state.toggleDone);
  const duplicateNode = useStore((state) => state.duplicateNode);
  const selectNode = useStore((state) => state.selectNode);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!node?.title) {
      setIsEditing(true);
      setEditText('');
    }
  }, [node?.title]);

  if (!node) return null;

  const handleSave = () => {
    if (editText.trim()) {
      updateNode(nodeId, { title: editText.trim() });
      setIsEditing(false);
    } else if (!node.title) {
      // Delete if empty and new
      deleteNode(nodeId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(node.title);
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      selectNode(nodeId, true);
    } else if (!isEditing) {
      selectNode(nodeId, false);
    }
  };

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditText(node.title);
    }
  };

  const handleAddChild = () => {
    if (node.level < 5) {
      const newNode = createNode(nodeId);
      if (newNode) {
        selectNode(newNode.id, false);
      }
    }
  };

  const handleDelete = () => {
    deleteNode(nodeId);
  };

  const handleDuplicate = () => {
    duplicateNode(nodeId);
  };

  const levelColor = theme.colors.levelColors[node.level] || theme.colors.primary;
  const hasChildren = node.childrenIds.length > 0;
  const canNest = node.level < 5;

  return (
    <div
      style={{
        marginBottom: '8px',
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
      data-node-id={nodeId}
    >
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: rtl ? '12px' : '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: isSelected
            ? `linear-gradient(135deg, ${levelColor}40, ${levelColor}20)`
            : `${levelColor}15`,
          border: `2px solid ${isSelected ? levelColor : levelColor + '40'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          direction: rtl ? 'rtl' : 'ltr',
          boxShadow: isSelected
            ? `0 4px 12px ${levelColor}40`
            : '0 2px 6px rgba(0,0,0,0.1)',
        }}
      >
        {/* Collapse button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(nodeId);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              color: levelColor,
              transform: node.isCollapsed
                ? rtl
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)'
                : rtl
                ? 'rotate(-90deg)'
                : 'rotate(90deg)',
              transition: 'transform 0.3s ease',
            }}
            aria-label={node.isCollapsed ? 'הרחב' : 'כווץ'}
          >
            {rtl ? '◀' : '▶'}
          </button>
        )}

        {/* Checkbox */}
        {node.isDone !== undefined && (
          <input
            type="checkbox"
            checked={node.isDone}
            onChange={(e) => {
              e.stopPropagation();
              toggleDone(nodeId);
            }}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: levelColor,
            }}
          />
        )}

        {/* Icon */}
        {node.icon && (
          <span style={{ fontSize: '20px' }} role="img">
            {node.icon}
          </span>
        )}

        {/* Title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={rtl ? 'הכנס טקסט...' : 'Enter text...'}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${levelColor}`,
              background: 'rgba(255,255,255,0.1)',
              color: theme.colors.text,
              fontSize: '15px',
              direction: rtl ? 'rtl' : 'ltr',
              outline: 'none',
            }}
          />
        ) : (
          <span
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: '15px',
              fontWeight: node.level === 0 ? '600' : '400',
              textDecoration: node.isDone ? 'line-through' : 'none',
              opacity: node.isDone ? 0.6 : 1,
            }}
          >
            {node.title || (rtl ? 'לחץ לעריכה...' : 'Click to edit...')}
          </span>
        )}

        {/* Pin indicator */}
        {node.isPinned && (
          <span style={{ fontSize: '14px' }} title={rtl ? 'נעוץ' : 'Pinned'}>
            📌
          </span>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            opacity: isSelected ? 1 : 0.6,
          }}
        >
          {canNest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddChild();
              }}
              title={rtl ? 'הוסף תת-פריט' : 'Add child'}
              style={{
                background: '#4ade80',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                cursor: 'pointer',
                color: '#1a1a2e',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              +
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate();
            }}
            title={rtl ? 'שכפל' : 'Duplicate'}
            style={{
              background: '#3b82f6',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '14px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'scale(1.1)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⎘
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            title={rtl ? 'מחק' : 'Delete'}
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'scale(1.1)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && !node.isCollapsed && (
        <div
          style={{
            [rtl ? 'marginRight' : 'marginLeft']: '24px',
            marginTop: '8px',
          }}
        >
          {node.childrenIds
            .filter((childId) => !filteredNodeIds || filteredNodeIds.has(childId))
            .map((childId) => (
              <ListItem
                key={childId}
                nodeId={childId}
                filteredNodeIds={filteredNodeIds}
              />
            ))}
        </div>
      )}
    </div>
  );
};
