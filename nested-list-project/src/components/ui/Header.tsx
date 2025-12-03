import React from 'react';
import { useStore } from '../../store/useStore';
import { countNodes } from '../../utils/nodeHelpers';

export const Header: React.FC = () => {
  const nodes = useStore((state) => state.nodes);
  const rootNodeIds = useStore((state) => state.rootNodeIds);
  const sessionName = useStore((state) => state.currentSession.name);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const focusPath = useStore((state) => state.currentSession.focusPath);

  const totalNodes = countNodes(rootNodeIds, nodes);
  const completedNodes = Object.values(nodes).filter((n) => n.isDone).length;

  return (
    <header
      style={{
        textAlign: 'center',
        marginBottom: '32px',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      <h1
        style={{
          fontSize: '42px',
          fontWeight: '800',
          color: theme.colors.primary,
          marginBottom: '8px',
          textShadow: `0 4px 20px ${theme.colors.primary}40`,
          letterSpacing: '2px',
        }}
      >
        {rtl ? 'רשימות מקוננות Sandbox' : 'Nested List Sandbox'}
      </h1>

      <p
        style={{
          color: theme.colors.text,
          opacity: 0.7,
          fontSize: '16px',
          marginBottom: '16px',
        }}
      >
        {sessionName}
      </p>

      {/* Breadcrumb for focus mode */}
      {focusPath && focusPath.length > 1 && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            display: 'inline-block',
            marginBottom: '12px',
            fontSize: '14px',
            color: theme.colors.text,
            opacity: 0.8,
          }}
        >
          🔍 {rtl ? 'מצב פוקוס' : 'Focus Mode'} -{' '}
          {focusPath.map((id) => nodes[id]?.title).join(' > ')}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            color: theme.colors.text,
            fontSize: '14px',
          }}
        >
          📊 {rtl ? 'סה"כ פריטים' : 'Total Items'}: <strong>{totalNodes}</strong>
        </div>

        {completedNodes > 0 && (
          <div
            style={{
              padding: '8px 20px',
              background: 'rgba(74, 222, 128, 0.2)',
              borderRadius: '20px',
              color: '#4ade80',
              fontSize: '14px',
            }}
          >
            ✓ {rtl ? 'בוצעו' : 'Completed'}: <strong>{completedNodes}</strong>
          </div>
        )}

        <div
          style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            color: theme.colors.text,
            fontSize: '14px',
          }}
        >
          🎨 {rtl ? 'ערכת נושא' : 'Theme'}: <strong>{theme.name}</strong>
        </div>
      </div>
    </header>
  );
};
