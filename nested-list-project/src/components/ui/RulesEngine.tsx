import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { SandboxRule } from '../../types/core';

/**
 * Rules Engine UI - Manage dynamic rules
 */
export const RulesEngine: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const rules = useStore((state) => state.currentSession.rules);
  const updateSession = useStore((state) => state.updateSession);

  const [editingRule, setEditingRule] = useState<SandboxRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Predefined rule types
  const ruleTypes = [
    { id: 'auto-collapse', name: rtl ? 'כיווץ אוטומטי' : 'Auto Collapse', description: rtl ? 'כווץ פריטים באופן אוטומטי' : 'Automatically collapse items' },
    { id: 'auto-tag', name: rtl ? 'תיוג אוטומטי' : 'Auto Tag', description: rtl ? 'הוסף תגיות באופן אוטומטי' : 'Automatically add tags' },
    { id: 'color-by-status', name: rtl ? 'צבע לפי סטטוס' : 'Color by Status', description: rtl ? 'שנה צבע לפי סטטוס' : 'Change color by status' },
    { id: 'auto-sort', name: rtl ? 'מיון אוטומטי' : 'Auto Sort', description: rtl ? 'מיין פריטים באופן אוטומטי' : 'Automatically sort items' },
    { id: 'time-based', name: rtl ? 'מבוסס זמן' : 'Time Based', description: rtl ? 'פעולות מבוססות זמן' : 'Time-based actions' },
  ];

  const createNewRule = (typeId: string) => {
    const ruleType = ruleTypes.find((t) => t.id === typeId);
    if (!ruleType) return;

    const newRule: SandboxRule = {
      id: Date.now().toString(),
      type: typeId,
      name: ruleType.name,
      description: ruleType.description,
      enabled: true,
      config: {},
    };

    setEditingRule(newRule);
    setIsCreating(true);
  };

  const saveRule = () => {
    if (!editingRule) return;

    if (isCreating) {
      updateSession({ rules: [...rules, editingRule] });
    } else {
      updateSession({
        rules: rules.map((r) => (r.id === editingRule.id ? editingRule : r)),
      });
    }

    setEditingRule(null);
    setIsCreating(false);
  };

  const deleteRule = (ruleId: string) => {
    updateSession({ rules: rules.filter((r) => r.id !== ruleId) });
  };

  const toggleRule = (ruleId: string) => {
    updateSession({
      rules: rules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
    });
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
          maxWidth: '600px',
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
            {rtl ? '⚙️ מנגנון חוקים' : '⚙️ Rules Engine'}
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

        {/* Existing Rules */}
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              color: theme.colors.text,
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
            }}
          >
            {rtl ? 'חוקים פעילים' : 'Active Rules'}
          </h3>

          {rules.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: theme.colors.text,
                opacity: 0.5,
                fontSize: '14px',
              }}
            >
              {rtl ? 'אין חוקים. צור חוק ראשון!' : 'No rules yet. Create your first rule!'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: rule.enabled
                      ? `${theme.colors.primary}15`
                      : `${theme.colors.border}20`,
                    border: `2px solid ${
                      rule.enabled ? theme.colors.primary : theme.colors.border
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: theme.colors.primary,
                        }}
                      />
                      <span
                        style={{
                          color: theme.colors.text,
                          fontSize: '16px',
                          fontWeight: 'bold',
                        }}
                      >
                        {rule.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setIsCreating(false);
                        }}
                        style={{
                          background: theme.colors.primary,
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 12px',
                          cursor: 'pointer',
                          color: theme.colors.background,
                          fontSize: '12px',
                        }}
                      >
                        {rtl ? 'ערוך' : 'Edit'}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        style={{
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 12px',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: '12px',
                        }}
                      >
                        {rtl ? 'מחק' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {rule.description && (
                    <p
                      style={{
                        color: theme.colors.text,
                        fontSize: '12px',
                        opacity: 0.7,
                        margin: '4px 0 0 0',
                      }}
                    >
                      {rule.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create New Rule */}
        {!editingRule && (
          <div>
            <h3
              style={{
                color: theme.colors.text,
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
              }}
            >
              {rtl ? 'צור חוק חדש' : 'Create New Rule'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ruleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => createNewRule(type.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: `${theme.colors.primary}10`,
                    border: `2px solid ${theme.colors.primary}40`,
                    cursor: 'pointer',
                    textAlign: rtl ? 'right' : 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${theme.colors.primary}20`;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${theme.colors.primary}10`;
                    e.currentTarget.style.borderColor = `${theme.colors.primary}40`;
                  }}
                >
                  <div
                    style={{
                      color: theme.colors.text,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '4px',
                    }}
                  >
                    {type.name}
                  </div>
                  <div
                    style={{
                      color: theme.colors.text,
                      fontSize: '12px',
                      opacity: 0.7,
                    }}
                  >
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Edit Rule Modal */}
        {editingRule && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: `${theme.colors.primary}20`,
              border: `2px solid ${theme.colors.primary}`,
            }}
          >
            <h3
              style={{
                color: theme.colors.text,
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              {isCreating
                ? rtl
                  ? 'הגדר חוק חדש'
                  : 'Configure New Rule'
                : rtl
                ? 'ערוך חוק'
                : 'Edit Rule'}
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  color: theme.colors.text,
                  fontSize: '12px',
                  marginBottom: '4px',
                }}
              >
                {rtl ? 'שם' : 'Name'}
              </label>
              <input
                type="text"
                value={editingRule.name}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, name: e.target.value })
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

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: theme.colors.text,
                  fontSize: '12px',
                  marginBottom: '4px',
                }}
              >
                {rtl ? 'תיאור' : 'Description'}
              </label>
              <textarea
                value={editingRule.description || ''}
                onChange={(e) =>
                  setEditingRule({
                    ...editingRule,
                    description: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.background,
                  color: theme.colors.text,
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingRule(null);
                  setIsCreating(false);
                }}
                style={{
                  padding: '8px 16px',
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
                onClick={saveRule}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: theme.colors.primary,
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.background,
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {rtl ? 'שמור' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
