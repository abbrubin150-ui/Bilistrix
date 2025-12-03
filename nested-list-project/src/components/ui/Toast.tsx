import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: string;
  message: string;
  type?: ToastType;
};

type ToastProps = {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  rtl?: boolean;
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, rtl }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3200);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.id]);

  const colors: Record<ToastType, { background: string; border: string }> = {
    success: { background: '#22c55e', border: '#15803d' },
    error: { background: '#ef4444', border: '#b91c1c' },
    info: { background: '#3b82f6', border: '#1d4ed8' },
  };

  const palette = colors[toast.type || 'info'];

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '10px',
        color: '#0b1224',
        background: palette.background,
        border: `1px solid ${palette.border}`,
        minWidth: '240px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      <span style={{ fontWeight: 600 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          border: 'none',
          background: 'rgba(0,0,0,0.08)',
          color: '#0b1224',
          borderRadius: '6px',
          padding: '6px 8px',
          cursor: 'pointer',
          fontWeight: 700,
        }}
        aria-label={rtl ? 'סגור התראה' : 'Dismiss notification'}
      >
        ×
      </button>
    </div>
  );
};

type ToastContainerProps = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  rtl?: boolean;
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  rtl,
}) => (
  <div
    style={{
      position: 'fixed',
      [rtl ? 'left' : 'right']: '24px',
      bottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 220,
      direction: rtl ? 'rtl' : 'ltr',
    }}
  >
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onDismiss={onDismiss} rtl={rtl} />
    ))}
  </div>
);
