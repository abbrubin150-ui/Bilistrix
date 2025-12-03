import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { SandboxPlugin } from '../../types/core';

/**
 * Plugins Manager UI - Manage plugins
 */
export const PluginsManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const plugins = useStore((state) => state.plugins);

  const [selectedPlugin, setSelectedPlugin] = useState<SandboxPlugin | null>(null);

  // Sample available plugins (in real app, these would be loaded dynamically)
  const availablePlugins: SandboxPlugin[] = [
    {
      id: 'plugin-export',
      name: rtl ? 'ייצוא מתקדם' : 'Advanced Export',
      version: '1.0.0',
      description: rtl
        ? 'ייצא נתונים לפורמטים שונים (CSV, JSON, Markdown)'
        : 'Export data to various formats (CSV, JSON, Markdown)',
    },
    {
      id: 'plugin-stats',
      name: rtl ? 'סטטיסטיקות' : 'Statistics',
      version: '1.0.0',
      description: rtl
        ? 'הצג סטטיסטיקות ותובנות על הנתונים'
        : 'Display statistics and insights about your data',
    },
    {
      id: 'plugin-sync',
      name: rtl ? 'סנכרון בענן' : 'Cloud Sync',
      version: '1.0.0',
      description: rtl
        ? 'סנכרן נתונים עם שירותי ענן'
        : 'Sync data with cloud services',
    },
    {
      id: 'plugin-ai',
      name: rtl ? 'עוזר AI' : 'AI Assistant',
      version: '1.0.0',
      description: rtl
        ? 'עוזר AI לארגון ואופטימיזציה של המשימות'
        : 'AI assistant for organizing and optimizing tasks',
    },
    {
      id: 'plugin-collab',
      name: rtl ? 'שיתוף פעולה' : 'Collaboration',
      version: '1.0.0',
      description: rtl
        ? 'שיתוף פעולה בזמן אמת עם משתמשים אחרים'
        : 'Real-time collaboration with other users',
    },
  ];

  const isInstalled = (pluginId: string) => {
    return plugins.some((p) => p.id === pluginId);
  };

  const installPlugin = (plugin: SandboxPlugin) => {
    // In a real app, this would load the plugin code dynamically
    console.log('Installing plugin:', plugin.id);
    // For now, just add it to the list
  };

  const uninstallPlugin = (pluginId: string) => {
    console.log('Uninstalling plugin:', pluginId);
  };

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
            {rtl ? '🧩 מנהל תוספים' : '🧩 Plugins Manager'}
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

        {/* Installed Plugins */}
        <div style={{ marginBottom: '32px' }}>
          <h3
            style={{
              color: theme.colors.text,
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}
          >
            {rtl ? 'תוספים מותקנים' : 'Installed Plugins'}
          </h3>

          {plugins.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: theme.colors.text,
                opacity: 0.5,
                fontSize: '14px',
                background: `${theme.colors.border}20`,
                borderRadius: '8px',
              }}
            >
              {rtl
                ? 'אין תוספים מותקנים. התקן תוסף ראשון!'
                : 'No plugins installed. Install your first plugin!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: `${theme.colors.primary}15`,
                    border: `2px solid ${theme.colors.primary}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: theme.colors.text,
                          fontSize: '16px',
                          fontWeight: 'bold',
                          marginBottom: '4px',
                        }}
                      >
                        {plugin.name}
                      </div>
                      <div
                        style={{
                          color: theme.colors.text,
                          fontSize: '12px',
                          opacity: 0.6,
                          marginBottom: '8px',
                        }}
                      >
                        {rtl ? 'גרסה' : 'Version'} {plugin.version}
                      </div>
                      {plugin.description && (
                        <p
                          style={{
                            color: theme.colors.text,
                            fontSize: '13px',
                            opacity: 0.8,
                            margin: 0,
                          }}
                        >
                          {plugin.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => uninstallPlugin(plugin.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#ef4444',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {rtl ? 'הסר' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Plugins */}
        <div>
          <h3
            style={{
              color: theme.colors.text,
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}
          >
            {rtl ? 'תוספים זמינים' : 'Available Plugins'}
          </h3>

          <div style={{ display: 'grid', gap: '12px' }}>
            {availablePlugins.map((plugin) => {
              const installed = isInstalled(plugin.id);

              return (
                <div
                  key={plugin.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: installed
                      ? `${theme.colors.border}20`
                      : `${theme.colors.primary}10`,
                    border: `2px solid ${
                      installed ? theme.colors.border : `${theme.colors.primary}40`
                    }`,
                    opacity: installed ? 0.6 : 1,
                    transition: 'all 0.2s',
                    cursor: installed ? 'default' : 'pointer',
                  }}
                  onClick={() => !installed && setSelectedPlugin(plugin)}
                  onMouseEnter={(e) => {
                    if (!installed) {
                      e.currentTarget.style.background = `${theme.colors.primary}20`;
                      e.currentTarget.style.borderColor = theme.colors.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!installed) {
                      e.currentTarget.style.background = `${theme.colors.primary}10`;
                      e.currentTarget.style.borderColor = `${theme.colors.primary}40`;
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            color: theme.colors.text,
                            fontSize: '16px',
                            fontWeight: 'bold',
                          }}
                        >
                          {plugin.name}
                        </span>
                        {installed && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: theme.colors.primary,
                              color: theme.colors.background,
                              fontSize: '10px',
                              fontWeight: 'bold',
                            }}
                          >
                            {rtl ? 'מותקן' : 'INSTALLED'}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          color: theme.colors.text,
                          fontSize: '12px',
                          opacity: 0.6,
                          marginBottom: '8px',
                        }}
                      >
                        {rtl ? 'גרסה' : 'Version'} {plugin.version}
                      </div>
                      <p
                        style={{
                          color: theme.colors.text,
                          fontSize: '13px',
                          opacity: 0.8,
                          margin: 0,
                        }}
                      >
                        {plugin.description}
                      </p>
                    </div>

                    {!installed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          installPlugin(plugin);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: theme.colors.primary,
                          border: 'none',
                          cursor: 'pointer',
                          color: theme.colors.background,
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {rtl ? 'התקן' : 'Install'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plugin Details Modal */}
        {selectedPlugin && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
            }}
            onClick={() => setSelectedPlugin(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: theme.colors.background,
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '90%',
                border: `2px solid ${theme.colors.primary}`,
              }}
            >
              <h3
                style={{
                  color: theme.colors.text,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                }}
              >
                {selectedPlugin.name}
              </h3>

              <div
                style={{
                  color: theme.colors.text,
                  fontSize: '14px',
                  opacity: 0.8,
                  marginBottom: '24px',
                }}
              >
                {selectedPlugin.description}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedPlugin(null)}
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
                  onClick={() => {
                    installPlugin(selectedPlugin);
                    setSelectedPlugin(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    background: theme.colors.primary,
                    border: 'none',
                    cursor: 'pointer',
                    color: theme.colors.background,
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {rtl ? 'התקן עכשיו' : 'Install Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
