import React from 'react';
import { Theme } from '../../types/core';

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  rtl?: boolean;
  theme: Theme;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  rtl = false,
  theme,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        direction: rtl ? 'rtl' : 'ltr',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.mode === 'dark' ? '#12121f' : 'white',
          color: theme.colors.text,
          borderRadius: '12px',
          minWidth: '360px',
          maxWidth: '520px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          border: `1px solid ${theme.colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.text,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
            aria-label={rtl ? 'סגור' : 'Close'}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px' }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: `1px solid ${theme.colors.border}`,
              display: 'flex',
              justifyContent: rtl ? 'flex-start' : 'flex-end',
              gap: '10px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
