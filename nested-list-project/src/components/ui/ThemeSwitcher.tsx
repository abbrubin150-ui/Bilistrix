import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { SandboxTheme } from '../../types/core';
import {
  THEMES,
} from '../../constants/themes';

/**
 * Theme Switcher UI - Switch between themes and create custom themes
 */
export const ThemeSwitcher: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const updateSession = useStore((state) => state.updateSession);

  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTheme, setCustomTheme] = useState<SandboxTheme | null>(null);

  const availableThemes = Object.values(THEMES);

  const selectTheme = (selectedTheme: SandboxTheme) => {
    updateSession({ theme: selectedTheme });
  };

  const createCustomTheme = () => {
    const newTheme: SandboxTheme = {
      id: `custom-${Date.now()}`,
      name: rtl ? 'ערכת נושא מותאמת אישית' : 'Custom Theme',
      mode: 'dark',
      colors: {
        primary: '#e94560',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        text: '#eaeaea',
        border: 'rgba(255,255,255,0.1)',
        levelColors: [
          '#e94560',
          '#0f3460',
          '#533483',
          '#4a4a6a',
          '#5a5a7a',
          '#6a6a8a',
        ],
      },
    };
    setCustomTheme(newTheme);
    setIsCreatingCustom(true);
  };

  const saveCustomTheme = () => {
    if (customTheme) {
      updateSession({ theme: customTheme });
      setIsCreatingCustom(false);
      setCustomTheme(null);
    }
  };

  const ThemePreview: React.FC<{ theme: SandboxTheme; isSelected: boolean }> = ({
    theme: previewTheme,
    isSelected,
  }) => (
    <div
      onClick={() => selectTheme(previewTheme)}
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: previewTheme.colors.background,
        border: `3px solid ${
          isSelected ? previewTheme.colors.primary : previewTheme.colors.border
        }`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: rtl ? 'auto' : '8px',
            left: rtl ? '8px' : 'auto',
            background: previewTheme.colors.primary,
            color: previewTheme.colors.background.includes('gradient')
              ? '#000'
              : previewTheme.colors.background,
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
          }}
        >
          {rtl ? '✓ נבחר' : '✓ ACTIVE'}
        </div>
      )}

      <div
        style={{
          color: previewTheme.colors.text,
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '12px',
        }}
      >
        {previewTheme.name}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '8px',
        }}
      >
        {previewTheme.colors.levelColors.map((color, index) => (
          <div
            key={index}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: color,
              border: `1px solid ${previewTheme.colors.border}`,
            }}
            title={rtl ? `רמה ${index}` : `Level ${index}`}
          />
        ))}
      </div>

      <div
        style={{
          color: previewTheme.colors.text,
          fontSize: '12px',
          opacity: 0.7,
        }}
      >
        {previewTheme.mode === 'dark'
          ? rtl
            ? 'מצב כהה'
            : 'Dark mode'
          : previewTheme.mode === 'light'
          ? rtl
            ? 'מצב בהיר'
            : 'Light mode'
          : rtl
          ? 'ניגודיות גבוהה'
          : 'High contrast'}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        direction: rtl ? 'rtl' : 'ltr',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.colors.background,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: `2px solid ${theme.colors.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              color: theme.colors.text,
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            {rtl ? '🎨 החלף ערכת נושא' : '🎨 Theme Switcher'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.text,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Available Themes */}
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              color: theme.colors.text,
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}
          >
            {rtl ? 'ערכות נושא זמינות' : 'Available Themes'}
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px',
            }}
          >
            {availableThemes.map((t) => (
              <ThemePreview key={t.id} theme={t} isSelected={t.id === theme.id} />
            ))}
          </div>
        </div>

        {/* Create Custom Theme */}
        {!isCreatingCustom ? (
          <button
            onClick={createCustomTheme}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '8px',
              background: `${theme.colors.primary}20`,
              border: `2px dashed ${theme.colors.primary}`,
              cursor: 'pointer',
              color: theme.colors.text,
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${theme.colors.primary}30`;
              e.currentTarget.style.borderStyle = 'solid';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${theme.colors.primary}20`;
              e.currentTarget.style.borderStyle = 'dashed';
            }}
          >
            {rtl ? '+ צור ערכת נושא מותאמת אישית' : '+ Create Custom Theme'}
          </button>
        ) : (
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: `${theme.colors.primary}15`,
              border: `2px solid ${theme.colors.primary}`,
            }}
          >
            <h3
              style={{
                color: theme.colors.text,
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              {rtl ? 'התאם ערכת נושא' : 'Customize Theme'}
            </h3>

            {customTheme && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Theme Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: theme.colors.text,
                      fontSize: '12px',
                      marginBottom: '4px',
                    }}
                  >
                    {rtl ? 'שם ערכת הנושא' : 'Theme Name'}
                  </label>
                  <input
                    type="text"
                    value={customTheme.name}
                    onChange={(e) =>
                      setCustomTheme({ ...customTheme, name: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme.colors.border}`,
                      background: theme.colors.background,
                      color: theme.colors.text,
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Primary Color */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: theme.colors.text,
                      fontSize: '12px',
                      marginBottom: '4px',
                    }}
                  >
                    {rtl ? 'צבע ראשי' : 'Primary Color'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customTheme.colors.primary}
                      onChange={(e) =>
                        setCustomTheme({
                          ...customTheme,
                          colors: {
                            ...customTheme.colors,
                            primary: e.target.value,
                          },
                        })
                      }
                      style={{
                        width: '60px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={customTheme.colors.primary}
                      onChange={(e) =>
                        setCustomTheme({
                          ...customTheme,
                          colors: {
                            ...customTheme.colors,
                            primary: e.target.value,
                          },
                        })
                      }
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${theme.colors.border}`,
                        background: theme.colors.background,
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                {/* Level Colors */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: theme.colors.text,
                      fontSize: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    {rtl ? 'צבעי רמות' : 'Level Colors'}
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                    }}
                  >
                    {customTheme.colors.levelColors.map((color, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          style={{
                            color: theme.colors.text,
                            fontSize: '11px',
                            minWidth: '20px',
                          }}
                        >
                          {index}:
                        </span>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newLevelColors = [...customTheme.colors.levelColors];
                            newLevelColors[index] = e.target.value;
                            setCustomTheme({
                              ...customTheme,
                              colors: {
                                ...customTheme.colors,
                                levelColors: newLevelColors,
                              },
                            });
                          }}
                          style={{
                            flex: 1,
                            height: '32px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                    marginTop: '8px',
                  }}
                >
                  <button
                    onClick={() => {
                      setIsCreatingCustom(false);
                      setCustomTheme(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: `2px solid ${theme.colors.border}`,
                      cursor: 'pointer',
                      color: theme.colors.text,
                      fontSize: '14px',
                    }}
                  >
                    {rtl ? 'ביטול' : 'Cancel'}
                  </button>
                  <button
                    onClick={saveCustomTheme}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      background: theme.colors.primary,
                      border: 'none',
                      cursor: 'pointer',
                      color: theme.colors.background.includes('gradient')
                        ? '#000'
                        : theme.colors.background,
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    {rtl ? 'שמור והחל' : 'Save & Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
