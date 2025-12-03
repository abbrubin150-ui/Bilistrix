import React, { useMemo } from 'react';
import { ListItem } from './ListItem';
import { useStore } from '../../store/useStore';
import { ListNode } from '../../types/core';
import { BoardView } from '../views/BoardView';
import { TreeView } from '../views/TreeView';
import { TimelineView } from '../views/TimelineView';
import { MinimalView } from '../views/MinimalView';

export const ListView: React.FC = () => {
  const nodes = useStore((state) => state.nodes);
  const rootNodeIds = useStore((state) => state.rootNodeIds);
  const selectedNodeIds = useStore((state) => state.currentSession.selectedNodeIds);
  const focusedNodeId = useStore((state) => state.currentSession.focusedNodeId);
  const filterConfig = useStore((state) => state.filterConfig);
  const rtl = useStore((state) => state.currentSession.rtl);
  const theme = useStore((state) => state.currentSession.theme);
  const viewMode = useStore((state) => state.currentSession.viewMode);

  // Apply filters
  const filteredNodeIds = useMemo(() => {
    const hasFilters =
      filterConfig.searchText ||
      (filterConfig.levels && filterConfig.levels.length > 0) ||
      filterConfig.isDone !== undefined;

    if (!hasFilters) {
      return null; // No filters, show all
    }

    const matchesFilter = (node: ListNode): boolean => {
      // Search text filter
      if (filterConfig.searchText) {
        const query = filterConfig.searchText.toLowerCase();
        const matchesTitle = node.title.toLowerCase().includes(query);
        const matchesDesc = node.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Level filter
      if (filterConfig.levels && filterConfig.levels.length > 0) {
        if (!filterConfig.levels.includes(node.level)) return false;
      }

      // Done filter
      if (filterConfig.isDone !== undefined) {
        if (node.isDone !== filterConfig.isDone) return false;
      }

      return true;
    };

    const filtered = new Set<string>();
    const addNodeAndAncestors = (nodeId: string) => {
      let current = nodes[nodeId];
      while (current) {
        filtered.add(current.id);
        if (!current.parentId) break;
        current = nodes[current.parentId];
      }
    };

    // Find all matching nodes and add their ancestors
    Object.values(nodes).forEach((node) => {
      if (matchesFilter(node)) {
        addNodeAndAncestors(node.id);
      }
    });

    return filtered;
  }, [nodes, filterConfig]);

  // If in focus mode, show only focused subtree
  const displayRootIds = focusedNodeId ? [focusedNodeId] : rootNodeIds;

  if (displayRootIds.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: theme.colors.text,
          opacity: 0.6,
          direction: rtl ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <div style={{ fontSize: '18px' }}>
          {rtl
            ? 'הרשימה ריקה. לחץ על "הוסף פריט חדש" להתחלה.'
            : 'The list is empty. Click "Add New Item" to start.'}
        </div>
      </div>
    );
  }

  // Filter display nodes
  const visibleRootIds = filteredNodeIds
    ? displayRootIds.filter((id) => filteredNodeIds.has(id))
    : displayRootIds;

  // Render different views based on viewMode
  const renderView = () => {
    switch (viewMode) {
      case 'board':
        return <BoardView />;
      case 'tree':
        return <TreeView />;
      case 'timeline':
        return <TimelineView />;
      case 'minimal':
        return <MinimalView />;
      case 'outline':
      default:
        return (
          <div style={{ direction: rtl ? 'rtl' : 'ltr' }}>
            {filteredNodeIds && (
              <div
                style={{
                  padding: '12px 16px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  background: `${theme.colors.primary}20`,
                  border: `1px solid ${theme.colors.primary}`,
                  color: theme.colors.text,
                  fontSize: '14px',
                }}
              >
                🔍 {rtl ? 'מוצגים' : 'Showing'} {filteredNodeIds.size}{' '}
                {rtl ? 'פריטים' : 'items'}
              </div>
            )}

            {visibleRootIds.map((nodeId) => (
              <ListItem
                key={nodeId}
                nodeId={nodeId}
                isSelected={selectedNodeIds.includes(nodeId)}
                filteredNodeIds={filteredNodeIds}
              />
            ))}
          </div>
        );
    }
  };

  return <>{renderView()}</>;
};
