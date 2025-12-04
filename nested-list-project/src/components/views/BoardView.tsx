import React from 'react';
import { useStore } from '../../store/useStore';
import { ListNode } from '../../types/core';

/**
 * Board View - Kanban-style board with columns per level
 */
export const BoardView: React.FC = () => {
  const nodes = useStore((state) => state.nodes);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const selectNode = useStore((state) => state.selectNode);
  const updateNode = useStore((state) => state.updateNode);
  const createNode = useStore((state) => state.createNode);
  const selectedNodeIds = useStore((state) => state.currentSession.selectedNodeIds);

  // Group nodes by level
  const nodesByLevel: Record<number, ListNode[]> = {};
  Object.values(nodes).forEach((node) => {
    if (!nodesByLevel[node.level]) {
      nodesByLevel[node.level] = [];
    }
    nodesByLevel[node.level].push(node);
  });

  const levels = Object.keys(nodesByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  const renderCard = (node: ListNode) => {
    const levelColor = theme.colors.levelColors[node.level] || theme.colors.primary;
    const isSelected = selectedNodeIds.includes(node.id);

    return (
      <div
        key={node.id}
        onClick={() => selectNode(node.id, false)}
        style={{
          padding: '12px',
          marginBottom: '8px',
          borderRadius: '8px',
          background: isSelected
            ? `linear-gradient(135deg, ${levelColor}40, ${levelColor}20)`
            : `${levelColor}15`,
          border: `2px solid ${isSelected ? levelColor : levelColor + '40'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isSelected
            ? `0 4px 12px ${levelColor}40`
            : '0 2px 6px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            direction: rtl ? 'rtl' : 'ltr',
          }}
        >
          {node.isDone !== undefined && (
            <input
              type="checkbox"
              checked={node.isDone}
              onChange={(e) => {
                e.stopPropagation();
                updateNode(node.id, { isDone: !node.isDone });
              }}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: levelColor,
              }}
            />
          )}
          {node.icon && (
            <span style={{ fontSize: '18px' }} role="img">
              {node.icon}
            </span>
          )}
          {node.isPinned && <span style={{ fontSize: '12px' }}>📌</span>}
        </div>

        <div
          style={{
            color: theme.colors.text,
            fontSize: '14px',
            fontWeight: node.level === 0 ? '600' : '400',
            textDecoration: node.isDone ? 'line-through' : 'none',
            opacity: node.isDone ? 0.6 : 1,
            marginBottom: '4px',
            direction: rtl ? 'rtl' : 'ltr',
          }}
        >
          {node.title}
        </div>

        {node.description && (
          <div
            style={{
              color: theme.colors.text,
              fontSize: '12px',
              opacity: 0.7,
              marginTop: '4px',
              direction: rtl ? 'rtl' : 'ltr',
            }}
          >
            {node.description}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            fontSize: '11px',
            color: theme.colors.text,
            opacity: 0.5,
          }}
        >
          <span>{rtl ? `רמה ${node.level}` : `Level ${node.level}`}</span>
          {node.childrenIds.length > 0 && (
            <span>
              {rtl
                ? `${node.childrenIds.length} תת-פריטים`
                : `${node.childrenIds.length} children`}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        padding: '16px',
        height: '100%',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      {levels.map((level) => {
        const levelNodes = nodesByLevel[level];
        const levelColor = theme.colors.levelColors[level] || theme.colors.primary;

        return (
          <div
            key={level}
            style={{
              minWidth: '280px',
              maxWidth: '320px',
              background: `${levelColor}10`,
              borderRadius: '12px',
              padding: '16px',
              border: `2px solid ${levelColor}30`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: levelColor,
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {rtl ? `רמה ${level}` : `Level ${level}`}
              </h3>
              <span
                style={{
                  background: levelColor,
                  color: theme.colors.background,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {levelNodes.length}
              </span>
            </div>

            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {levelNodes.map(renderCard)}
            </div>

            {level < 5 && (
              <button
                onClick={() => {
                  const parent = levelNodes[0]?.parentId;
                  createNode(parent || null);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '8px',
                  background: 'transparent',
                  border: `2px dashed ${levelColor}40`,
                  borderRadius: '8px',
                  color: levelColor,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${levelColor}20`;
                  e.currentTarget.style.borderColor = levelColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = `${levelColor}40`;
                }}
              >
                {rtl ? '+ הוסף כרטיס' : '+ Add card'}
              </button>
            )}
          </div>
        );
      })}

      {levels.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            color: theme.colors.text,
            opacity: 0.5,
          }}
        >
          <p style={{ fontSize: '18px', marginBottom: '16px' }}>
            {rtl ? 'הלוח ריק' : 'Board is empty'}
          </p>
          <button
            onClick={() => createNode(null)}
            style={{
              padding: '12px 24px',
              background: theme.colors.primary,
              color: theme.colors.background,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {rtl ? 'צור כרטיס ראשון' : 'Create first card'}
          </button>
        </div>
      )}
    </div>
  );
};
