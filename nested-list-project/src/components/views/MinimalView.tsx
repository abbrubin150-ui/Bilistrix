import React from 'react';
import { useStore } from '../../store/useStore';

/**
 * Minimal View - Ultra-clean, distraction-free view
 */
export const MinimalView: React.FC = () => {
  const nodes = useStore((state) => state.nodes);
  const rootNodeIds = useStore((state) => state.rootNodeIds);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const selectNode = useStore((state) => state.selectNode);
  const toggleDone = useStore((state) => state.toggleDone);
  const selectedNodeIds = useStore((state) => state.currentSession.selectedNodeIds);

  const renderNode = (nodeId: string, depth: number = 0): JSX.Element | null => {
    const node = nodes[nodeId];
    if (!node) return null;

    const isSelected = selectedNodeIds.includes(nodeId);
    const hasChildren = node.childrenIds.length > 0;

    return (
      <div key={nodeId}>
        <div
          onClick={() => selectNode(nodeId, false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 0',
            paddingLeft: rtl ? '0' : `${depth * 32}px`,
            paddingRight: rtl ? `${depth * 32}px` : '0',
            cursor: 'pointer',
            background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
            borderLeft: rtl
              ? 'none'
              : isSelected
              ? `3px solid ${theme.colors.primary}`
              : '3px solid transparent',
            borderRight: rtl
              ? isSelected
                ? `3px solid ${theme.colors.primary}`
                : '3px solid transparent'
              : 'none',
            transition: 'all 0.2s ease',
            direction: rtl ? 'rtl' : 'ltr',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {/* Minimal checkbox */}
          {node.isDone !== undefined && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleDone(nodeId);
              }}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: `2px solid ${theme.colors.text}40`,
                background: node.isDone ? theme.colors.primary : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            />
          )}

          {/* Title */}
          <span
            style={{
              color: theme.colors.text,
              fontSize: '15px',
              fontWeight: depth === 0 ? '500' : '400',
              textDecoration: node.isDone ? 'line-through' : 'none',
              opacity: node.isDone ? 0.5 : isSelected ? 1 : 0.8,
              transition: 'opacity 0.2s',
            }}
          >
            {node.title}
          </span>

          {/* Minimal indicators */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginLeft: 'auto',
              marginRight: rtl ? 'auto' : '0',
              opacity: isSelected ? 1 : 0.3,
              transition: 'opacity 0.2s',
            }}
          >
            {node.isPinned && (
              <span style={{ fontSize: '12px', opacity: 0.6 }}>📌</span>
            )}
            {hasChildren && (
              <span
                style={{
                  fontSize: '11px',
                  color: theme.colors.text,
                  opacity: 0.5,
                }}
              >
                {node.childrenIds.length}
              </span>
            )}
          </div>
        </div>

        {/* Children - always visible in minimal view */}
        {hasChildren && (
          <div>
            {node.childrenIds.map((childId) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '720px',
        margin: '0 auto',
        height: '100%',
        overflowY: 'auto',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {rootNodeIds.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {rootNodeIds.map((rootId) => renderNode(rootId, 0))}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.colors.text,
            opacity: 0.4,
            fontSize: '14px',
          }}
        >
          {rtl ? 'התצוגה ריקה. הוסף פריטים כדי להתחיל.' : 'View is empty. Add items to start.'}
        </div>
      )}
    </div>
  );
};
