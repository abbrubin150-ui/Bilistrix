import React from 'react';
import { useStore } from '../../store/useStore';

type StatusBadgeProps = {
  isSaving: boolean;
  hasPendingChanges: boolean;
  lastSavedAt: number | null;
};

const formatTime = (timestamp: number, rtl: boolean) => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return rtl ? 'נשמר לפני רגע' : 'Saved just now';
  }

  const formatter = new Intl.DateTimeFormat(rtl ? 'he-IL' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${rtl ? 'נשמר ב-' : 'Saved at'} ${formatter.format(timestamp)}`;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isSaving,
  hasPendingChanges,
  lastSavedAt,
}) => {
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);

  const statusText = (() => {
    if (isSaving) {
      return rtl ? 'שומר…' : 'Saving…';
    }
    if (hasPendingChanges) {
      return rtl ? 'שינויים ממתינים לשמירה' : 'Pending changes';
    }
    if (lastSavedAt) {
      return formatTime(lastSavedAt, rtl);
    }
    return rtl ? 'טרם נשמר' : 'Not saved yet';
  })();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '999px',
        background: isSaving
          ? `${theme.colors.primary}25`
          : hasPendingChanges
          ? 'rgba(255, 199, 96, 0.18)'
          : 'rgba(74, 222, 128, 0.15)',
        border: `1px solid ${theme.colors.border}`,
        color: theme.colors.text,
        fontSize: '14px',
        fontWeight: 600,
        minWidth: '210px',
        justifyContent: 'center',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      <span
        aria-hidden
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: isSaving
            ? theme.colors.primary
            : hasPendingChanges
            ? '#f59e0b'
            : '#22c55e',
          boxShadow: isSaving ? `0 0 0 6px ${theme.colors.primary}10` : undefined,
        }}
      />
      <span>{statusText}</span>
    </div>
  );
};
