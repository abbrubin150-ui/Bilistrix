import React, { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ListNode } from '../../types/core';
import { useStore } from '../../store/useStore';

const ITEM_TYPE = 'LIST_ITEM';

interface ListItemProps {
  nodeId: string;
  isSelected?: boolean;
  isDragging?: boolean;
  filteredNodeIds?: Set<string> | null;
}

export const ListItem: React.FC<ListItemProps> = ({
  nodeId,
  isSelected = false,
  isDragging: isDraggingProp = false,
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
  const moveNode = useStore((state) => state.moveNode);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  // Drag source
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => ({ nodeId, node }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isEditing,
  });

  // Drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { nodeId: string; node: ListNode }, monitor) => {
      if (!monitor.didDrop() && item.nodeId !== nodeId) {
        // Move the dragged node to be a child of this node
        moveNode(item.nodeId, nodeId);
      }
    },
    canDrop: (item: { nodeId: string; node: ListNode }) => {
      // Can't drop on itself or its own descendants
      if (item.nodeId === nodeId) return false;

      // Check if target is a descendant of source
      let current = node;
      while (current) {
        if (current.id === item.nodeId) return false;
        current = current.parentId ? useStore.getState().nodes[current.parentId] : null;
      }

      // Check depth limit
      return node.level < 5;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  drag(drop(divRef));

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
      ref={divRef}
      role="treeitem"
      aria-level={node.level + 1}
      aria-expanded={hasChildren ? !node.isCollapsed : undefined}
      aria-selected={isSelected}
      aria-label={`${node.title}${node.isPinned ? (rtl ? ', נעוץ' : ', pinned') : ''}${
        node.isDone ? (rtl ? ', הושלם' : ', completed') : ''
      }${hasChildren ? ` (${node.childrenIds.length} ${rtl ? 'תתי-פריטים' : 'children'})` : ''}`}
      tabIndex={0}
      style={{
        marginBottom: '8px',
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.2s',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      data-node-id={nodeId}
    >
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        role="button"
        aria-describedby={node.description ? `desc-${nodeId}` : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: rtl ? '12px' : '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: isSelected
            ? `linear-gradient(135deg, ${levelColor}40, ${levelColor}20)`
            : `${levelColor}15`,
          border: `2px solid ${
            isOver && canDrop
              ? '#4ade80'
              : isSelected
              ? levelColor
              : levelColor + '40'
          }`,
          cursor: isDragging ? 'grabbing' : 'pointer',
          transition: 'all 0.2s ease',
          direction: rtl ? 'rtl' : 'ltr',
          boxShadow: isSelected
            ? `0 4px 12px ${levelColor}40`
            : isOver && canDrop
            ? '0 4px 12px rgba(74, 222, 128, 0.4)'
            : '0 2px 6px rgba(0,0,0,0.1)',
          transform: isOver && canDrop ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Collapse button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(nodeId);
            }}
            aria-label={
              node.isCollapsed
                ? rtl
                  ? `הרחב ${node.title}`
                  : `Expand ${node.title}`
                : rtl
                ? `כווץ ${node.title}`
                : `Collapse ${node.title}`
            }
            aria-expanded={!node.isCollapsed}
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
            aria-label={
              rtl
                ? `סמן ${node.title} כ${node.isDone ? 'לא הושלם' : 'הושלם'}`
                : `Mark ${node.title} as ${node.isDone ? 'incomplete' : 'complete'}`
            }
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
              aria-label={rtl ? `הוסף תת-פריט ל${node.title}` : `Add child to ${node.title}`}
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
            aria-label={rtl ? `שכפל ${node.title}` : `Duplicate ${node.title}`}
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
            aria-label={rtl ? `מחק ${node.title}` : `Delete ${node.title}`}
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
          role="group"
          aria-label={rtl ? `תתי-פריטים של ${node.title}` : `Children of ${node.title}`}
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

      {/* Hidden description for screen readers */}
      {node.description && (
        <span id={`desc-${nodeId}`} style={{ display: 'none' }}>
          {node.description}
        </span>
      )}
    </div>
  );
};
