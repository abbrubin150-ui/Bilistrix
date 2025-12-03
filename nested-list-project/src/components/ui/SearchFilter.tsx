import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

export const SearchFilter: React.FC = () => {
  const filterConfig = useStore((state) => state.filterConfig);
  const setFilter = useStore((state) => state.setFilter);
  const clearFilter = useStore((state) => state.clearFilter);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState(filterConfig.searchText || '');
  const [selectedLevels, setSelectedLevels] = useState<number[]>(
    filterConfig.levels || []
  );
  const [showDoneFilter, setShowDoneFilter] = useState<boolean | undefined>(
    filterConfig.isDone
  );

  const handleApplyFilter = () => {
    setFilter({
      searchText: searchText || undefined,
      levels: selectedLevels.length > 0 ? selectedLevels : undefined,
      isDone: showDoneFilter,
    });
  };

  const handleClearFilter = () => {
    setSearchText('');
    setSelectedLevels([]);
    setShowDoneFilter(undefined);
    clearFilter();
  };

  const toggleLevel = (level: number) => {
    setSelectedLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level]
    );
  };

  const hasActiveFilter =
    searchText || selectedLevels.length > 0 || showDoneFilter !== undefined;

  return (
    <div
      style={{
        marginBottom: '24px',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: isExpanded ? '16px' : '0',
        }}
      >
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleApplyFilter();
            }
          }}
          placeholder={rtl ? '🔍 חיפוש...' : '🔍 Search...'}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`,
            background: 'rgba(255,255,255,0.1)',
            color: theme.colors.text,
            fontSize: '15px',
            direction: rtl ? 'rtl' : 'ltr',
            outline: searchText ? `2px solid ${theme.colors.primary}` : 'none',
          }}
        />

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`,
            background: isExpanded
              ? `${theme.colors.primary}30`
              : 'rgba(255,255,255,0.1)',
            color: theme.colors.text,
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          {rtl ? '🔧 מסננים' : '🔧 Filters'}
          {hasActiveFilter && ' •'}
        </button>

        <button
          onClick={handleApplyFilter}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            border: `2px solid ${theme.colors.primary}`,
            background: `${theme.colors.primary}20`,
            color: theme.colors.primary,
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {rtl ? '✓ החל' : '✓ Apply'}
        </button>

        {hasActiveFilter && (
          <button
            onClick={handleClearFilter}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.border}`,
              background: 'rgba(255,255,255,0.1)',
              color: theme.colors.text,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {rtl ? '✕ נקה' : '✕ Clear'}
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {/* Level Filter */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: theme.colors.text,
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {rtl ? 'סנן לפי רמה:' : 'Filter by Level:'}
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: selectedLevels.includes(level)
                      ? `2px solid ${theme.colors.levelColors[level]}`
                      : `1px solid ${theme.colors.border}`,
                    background: selectedLevels.includes(level)
                      ? `${theme.colors.levelColors[level]}30`
                      : 'rgba(255,255,255,0.1)',
                    color: theme.colors.text,
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: selectedLevels.includes(level) ? '600' : '400',
                  }}
                >
                  {rtl ? `רמה ${level + 1}` : `Level ${level + 1}`}
                </button>
              ))}
            </div>
          </div>

          {/* Done Filter */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: theme.colors.text,
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {rtl ? 'מצב ביצוע:' : 'Completion Status:'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() =>
                  setShowDoneFilter(showDoneFilter === true ? undefined : true)
                }
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border:
                    showDoneFilter === true
                      ? `2px solid #4ade80`
                      : `1px solid ${theme.colors.border}`,
                  background:
                    showDoneFilter === true
                      ? 'rgba(74, 222, 128, 0.3)'
                      : 'rgba(255,255,255,0.1)',
                  color: theme.colors.text,
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: showDoneFilter === true ? '600' : '400',
                }}
              >
                ✓ {rtl ? 'בוצעו' : 'Completed'}
              </button>

              <button
                onClick={() =>
                  setShowDoneFilter(showDoneFilter === false ? undefined : false)
                }
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border:
                    showDoneFilter === false
                      ? `2px solid #ef4444`
                      : `1px solid ${theme.colors.border}`,
                  background:
                    showDoneFilter === false
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'rgba(255,255,255,0.1)',
                  color: theme.colors.text,
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: showDoneFilter === false ? '600' : '400',
                }}
              >
                ○ {rtl ? 'לא בוצעו' : 'Not Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
