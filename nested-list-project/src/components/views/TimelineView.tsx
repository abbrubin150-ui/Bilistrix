import React from 'react';
import { useStore } from '../../store/useStore';
import { ListNode } from '../../types/core';

/**
 * Timeline View - Chronological view based on creation/update time
 */
export const TimelineView: React.FC = () => {
  const nodes = useStore((state) => state.nodes);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const selectNode = useStore((state) => state.selectNode);
  const selectedNodeIds = useStore((state) => state.currentSession.selectedNodeIds);

  // Sort nodes by creation time (most recent first)
  const sortedNodes = Object.values(nodes).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  // Group by date
  const groupedByDate: Record<string, ListNode[]> = {};
  sortedNodes.forEach((node) => {
    const date = new Date(node.createdAt);
    const dateKey = date.toLocaleDateString(rtl ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(node);
  });

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(rtl ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderNode = (node: ListNode) => {
    const isSelected = selectedNodeIds.includes(node.id);
    const levelColor = theme.colors.levelColors[node.level] || theme.colors.primary;

    return (
      <div
        key={node.id}
        onClick={() => selectNode(node.id, false)}
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          direction: rtl ? 'rtl' : 'ltr',
          cursor: 'pointer',
        }}
      >
        {/* Timeline axis */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '60px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: theme.colors.text,
              opacity: 0.6,
              marginBottom: '4px',
            }}
          >
            {formatTime(node.createdAt)}
          </div>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: levelColor,
              border: `3px solid ${isSelected ? levelColor : `${levelColor}40`}`,
              boxShadow: isSelected ? `0 0 8px ${levelColor}` : 'none',
              transition: 'all 0.2s',
            }}
          />
          <div
            style={{
              width: '2px',
              flex: 1,
              background: `linear-gradient(to bottom, ${levelColor}40, transparent)`,
              minHeight: '20px',
            }}
          />
        </div>

        {/* Content card */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            background: isSelected
              ? `linear-gradient(135deg, ${levelColor}40, ${levelColor}20)`
              : `${levelColor}15`,
            border: `2px solid ${isSelected ? levelColor : `${levelColor}40`}`,
            transition: 'all 0.2s ease',
            boxShadow: isSelected
              ? `0 4px 12px ${levelColor}40`
              : '0 2px 6px rgba(0,0,0,0.1)',
            transform: isSelected ? 'translateX(8px)' : 'translateX(0)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            {node.icon && (
              <span style={{ fontSize: '20px' }} role="img">
                {node.icon}
              </span>
            )}
            <span
              style={{
                color: theme.colors.text,
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: node.isDone ? 'line-through' : 'none',
                opacity: node.isDone ? 0.6 : 1,
              }}
            >
              {node.title}
            </span>
            {node.isPinned && <span style={{ fontSize: '14px' }}>📌</span>}
          </div>

          {node.description && (
            <p
              style={{
                color: theme.colors.text,
                fontSize: '14px',
                opacity: 0.8,
                margin: '8px 0',
              }}
            >
              {node.description}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '12px',
              fontSize: '12px',
              color: theme.colors.text,
              opacity: 0.6,
            }}
          >
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: `${levelColor}30`,
                color: levelColor,
              }}
            >
              {rtl ? `רמה ${node.level}` : `Level ${node.level}`}
            </span>

            {node.childrenIds.length > 0 && (
              <span>
                {rtl
                  ? `${node.childrenIds.length} תת-פריטים`
                  : `${node.childrenIds.length} children`}
              </span>
            )}

            {node.updatedAt !== node.createdAt && (
              <span>
                {rtl ? 'עודכן: ' : 'Updated: '}
                {formatTime(node.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '800px',
        margin: '0 auto',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {Object.keys(groupedByDate).length > 0 ? (
        Object.entries(groupedByDate).map(([date, dateNodes]) => (
          <div key={date} style={{ marginBottom: '32px' }}>
            <h3
              style={{
                color: theme.colors.primary,
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: `2px solid ${theme.colors.primary}40`,
                direction: rtl ? 'rtl' : 'ltr',
              }}
            >
              {date}
            </h3>
            {dateNodes.map((node) => renderNode(node))}
          </div>
        ))
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
          {rtl
            ? 'ציר הזמן ריק. הוסף פריטים כדי להתחיל.'
            : 'Timeline is empty. Add items to start.'}
        </div>
      )}
    </div>
  );
};
