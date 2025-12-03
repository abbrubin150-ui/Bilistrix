import React from 'react';
import { useStore } from '../../store/useStore';
import { ListNode } from '../../types/core';

/**
 * Tree View - Classic tree structure with branches
 */
export const TreeView: React.FC = () => {
  const nodes = useStore((state) => state.nodes);
  const rootNodeIds = useStore((state) => state.rootNodeIds);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const selectNode = useStore((state) => state.selectNode);
  const toggleCollapse = useStore((state) => state.toggleCollapse);
  const selectedNodeIds = useStore((state) => state.currentSession.selectedNodeIds);

  const renderNode = (
    nodeId: string,
    isLast: boolean = true,
    prefix: string = ''
  ): JSX.Element | null => {
    const node = nodes[nodeId];
    if (!node) return null;

    const hasChildren = node.childrenIds.length > 0;
    const isSelected = selectedNodeIds.includes(nodeId);
    const levelColor = theme.colors.levelColors[node.level] || theme.colors.primary;

    // Tree branch characters
    const branch = isLast ? '└─' : '├─';
    const vertical = isLast ? '  ' : '│ ';

    return (
      <div key={nodeId}>
        <div
          onClick={() => selectNode(nodeId, false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            cursor: 'pointer',
            background: isSelected ? `${levelColor}20` : 'transparent',
            borderRadius: '4px',
            transition: 'background 0.2s',
            direction: rtl ? 'rtl' : 'ltr',
            fontFamily: 'monospace',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = `${levelColor}10`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {/* Tree structure */}
          <span
            style={{
              color: levelColor,
              opacity: 0.5,
              marginRight: rtl ? '0' : '8px',
              marginLeft: rtl ? '8px' : '0',
            }}
          >
            {prefix}
            {branch}
          </span>

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
                fontSize: '12px',
                padding: '2px 4px',
                color: levelColor,
                marginRight: rtl ? '0' : '4px',
                marginLeft: rtl ? '4px' : '0',
              }}
            >
              {node.isCollapsed ? (rtl ? '◀' : '▶') : '▼'}
            </button>
          )}

          {/* Icon */}
          {node.icon && (
            <span
              style={{
                fontSize: '16px',
                marginRight: rtl ? '0' : '4px',
                marginLeft: rtl ? '4px' : '0',
              }}
              role="img"
            >
              {node.icon}
            </span>
          )}

          {/* Title */}
          <span
            style={{
              color: theme.colors.text,
              fontSize: '14px',
              fontWeight: node.level === 0 ? '600' : '400',
              textDecoration: node.isDone ? 'line-through' : 'none',
              opacity: node.isDone ? 0.6 : 1,
            }}
          >
            {node.title}
          </span>

          {/* Pin indicator */}
          {node.isPinned && (
            <span
              style={{
                fontSize: '12px',
                marginLeft: rtl ? '0' : '8px',
                marginRight: rtl ? '8px' : '0',
              }}
            >
              📌
            </span>
          )}

          {/* Children count */}
          {hasChildren && (
            <span
              style={{
                fontSize: '11px',
                color: levelColor,
                opacity: 0.7,
                marginLeft: rtl ? '0' : '8px',
                marginRight: rtl ? '8px' : '0',
              }}
            >
              ({node.childrenIds.length})
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && !node.isCollapsed && (
          <div style={{ paddingLeft: rtl ? '0' : '24px', paddingRight: rtl ? '24px' : '0' }}>
            {node.childrenIds.map((childId, index) => {
              const isLastChild = index === node.childrenIds.length - 1;
              const newPrefix = prefix + vertical;
              return renderNode(childId, isLastChild, newPrefix);
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '24px',
        fontFamily: 'monospace',
        color: theme.colors.text,
        overflowX: 'auto',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {rootNodeIds.length > 0 ? (
        rootNodeIds.map((rootId, index) =>
          renderNode(rootId, index === rootNodeIds.length - 1)
        )
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.colors.text,
            opacity: 0.5,
          }}
        >
          {rtl ? 'העץ ריק. הוסף פריטים כדי להתחיל.' : 'Tree is empty. Add items to start.'}
        </div>
      )}
    </div>
  );
};
