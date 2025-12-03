import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useToastStore } from '../../store/useToastStore';
import { Modal } from './Modal';

type PanelView = 'snapshots' | 'templates' | 'sessions' | 'themes';

export const SidePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PanelView>('snapshots');
  const [modalType, setModalType] = useState<
    | 'createSnapshot'
    | 'restoreSnapshot'
    | 'deleteSnapshot'
    | 'createTemplate'
    | 'deleteTemplate'
    | 'createSession'
    | null
  >(null);
  const [modalTargetId, setModalTargetId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: '', description: '' });

  const snapshots = useStore((state) => Object.values(state.snapshots));
  const templates = useStore((state) => Object.values(state.templates));
  const sessions = useStore((state) => Object.values(state.sessions));
  const currentSessionId = useStore((state) => state.currentSession.id);
  const theme = useStore((state) => state.currentSession.theme);
  const rtl = useStore((state) => state.currentSession.rtl);
  const selectedNodeIds = useStore((state) => state.currentSession.selectedNodeIds);
  const addToast = useToastStore((state) => state.addToast);

  const createSnapshot = useStore((state) => state.createSnapshot);
  const restoreSnapshot = useStore((state) => state.restoreSnapshot);
  const deleteSnapshot = useStore((state) => state.deleteSnapshot);
  const createTemplate = useStore((state) => state.createTemplate);
  const applyTemplate = useStore((state) => state.applyTemplate);
  const deleteTemplate = useStore((state) => state.deleteTemplate);
  const switchSession = useStore((state) => state.switchSession);
  const createSession = useStore((state) => state.createSession);

  const isTemplateActionDisabled = useMemo(
    () => selectedNodeIds.length === 0,
    [selectedNodeIds.length]
  );

  const resetModal = () => {
    setModalType(null);
    setModalTargetId(null);
    setFormState({ name: '', description: '' });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(rtl ? 'he-IL' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const handleCreateSnapshot = () => {
    setFormState({ name: '', description: '' });
    setModalType('createSnapshot');
  };

  const handleRestoreSnapshot = (id: string) => {
    setModalType('restoreSnapshot');
    setModalTargetId(id);
  };

  const handleDeleteSnapshot = (id: string) => {
    setModalType('deleteSnapshot');
    setModalTargetId(id);
  };

  const handleSaveAsTemplate = () => {
    if (isTemplateActionDisabled) {
      addToast(rtl ? 'אנא בחר פריט לשמור כתבנית' : 'Select an item to save as a template', 'error');
      return;
    }

    setFormState({ name: '', description: '' });
    setModalType('createTemplate');
  };

  const handleApplyTemplate = (id: string) => {
    applyTemplate(id, null); // Apply to root
    addToast(rtl ? 'תבנית הוחלה בהצלחה' : 'Template applied successfully', 'success');
  };

  const handleDeleteTemplate = (id: string) => {
    setModalType('deleteTemplate');
    setModalTargetId(id);
  };

  const handleCreateSession = () => {
    setFormState({ name: '', description: '' });
    setModalType('createSession');
  };

  const submitForm = () => {
    if (!formState.name.trim()) {
      addToast(rtl ? 'שם הוא שדה חובה' : 'Name is required', 'error');
      return;
    }

    switch (modalType) {
      case 'createSnapshot':
        createSnapshot(formState.name.trim(), formState.description.trim() || undefined);
        addToast(rtl ? 'Snapshot נשמר בהצלחה' : 'Snapshot saved successfully', 'success');
        break;
      case 'createTemplate':
        if (selectedNodeIds[0]) {
          createTemplate(selectedNodeIds[0], formState.name.trim(), formState.description.trim() || undefined);
          addToast(rtl ? 'תבנית נשמרה' : 'Template saved', 'success');
        } else {
          addToast(rtl ? 'אין פריט נבחר' : 'No item selected to template', 'error');
        }
        break;
      case 'createSession':
        createSession(formState.name.trim(), formState.description.trim() || undefined);
        addToast(rtl ? 'Session נוצר' : 'Session created', 'success');
        break;
      default:
        break;
    }

    resetModal();
  };

  const confirmAction = () => {
    if (!modalTargetId) {
      resetModal();
      return;
    }

    if (modalType === 'restoreSnapshot') {
      restoreSnapshot(modalTargetId);
      addToast(rtl ? 'Snapshot שוחזר בהצלחה' : 'Snapshot restored successfully', 'success');
    }

    if (modalType === 'deleteSnapshot') {
      deleteSnapshot(modalTargetId);
      addToast(rtl ? 'Snapshot נמחק' : 'Snapshot deleted', 'success');
    }

    if (modalType === 'deleteTemplate') {
      deleteTemplate(modalTargetId);
      addToast(rtl ? 'Template נמחקה' : 'Template deleted', 'success');
    }

    resetModal();
  };

  const isFormModal =
    modalType === 'createSnapshot' ||
    modalType === 'createTemplate' ||
    modalType === 'createSession';

  const modalTitle = (() => {
    switch (modalType) {
      case 'createSnapshot':
        return rtl ? 'צור Snapshot חדש' : 'Create Snapshot';
      case 'restoreSnapshot':
        return rtl ? 'לאשר שחזור Snapshot?' : 'Confirm Snapshot Restore';
      case 'deleteSnapshot':
        return rtl ? 'למחוק Snapshot?' : 'Delete Snapshot?';
      case 'createTemplate':
        return rtl ? 'שמור כתבנית' : 'Save as Template';
      case 'deleteTemplate':
        return rtl ? 'למחוק Template?' : 'Delete Template?';
      case 'createSession':
        return rtl ? 'צור Session חדש' : 'Create Session';
      default:
        return '';
    }
  })();

  const modalContent = (() => {
    if (!modalType) return null;

    if (isFormModal) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ color: theme.colors.text, fontWeight: 600 }}>
              {rtl ? 'שם (חובה)' : 'Name (required)'}
            </span>
            <input
              value={formState.name}
              onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={rtl ? 'הקלד שם...' : 'Enter a name...'}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
                background: theme.mode === 'dark' ? '#0f172a' : 'white',
                color: theme.colors.text,
                fontSize: '14px',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ color: theme.colors.text, fontWeight: 600 }}>
              {rtl ? 'תיאור (אופציונלי)' : 'Description (optional)'}
            </span>
            <textarea
              value={formState.description}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder={rtl ? 'הוסף הקשר...' : 'Add context...'}
              rows={3}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
                background: theme.mode === 'dark' ? '#0f172a' : 'white',
                color: theme.colors.text,
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </label>
        </div>
      );
    }

    if (modalType === 'restoreSnapshot') {
      return (
        <p style={{ margin: 0, color: theme.colors.text, lineHeight: 1.6 }}>
          {rtl
            ? 'האם לשחזר את ה-Snapshot הנבחר ולהחליף את העץ הנוכחי?'
            : 'Restore the selected snapshot and replace the current tree?'}
        </p>
      );
    }

    if (modalType === 'deleteSnapshot') {
      return (
        <p style={{ margin: 0, color: theme.colors.text, lineHeight: 1.6 }}>
          {rtl
            ? 'האם למחוק לצמיתות את ה-Snapshot?'
            : 'Permanently delete this snapshot?'}
        </p>
      );
    }

    if (modalType === 'deleteTemplate') {
      return (
        <p style={{ margin: 0, color: theme.colors.text, lineHeight: 1.6 }}>
          {rtl
            ? 'האם למחוק את התבנית שנשמרה?'
            : 'Delete this saved template?'}
        </p>
      );
    }

    return null;
  })();

  const modalFooter = (() => {
    if (!modalType) return null;

    const primaryLabel = isFormModal
      ? rtl
        ? 'שמור'
        : 'Save'
      : modalType === 'restoreSnapshot'
        ? rtl
          ? 'שחזר'
          : 'Restore'
        : rtl
          ? 'מחק'
          : 'Delete';

    const primaryAction = isFormModal ? submitForm : confirmAction;

    return (
      <>
        <button
          onClick={resetModal}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`,
            background: 'transparent',
            color: theme.colors.text,
            cursor: 'pointer',
          }}
        >
          {rtl ? 'ביטול' : 'Cancel'}
        </button>
        <button
          onClick={primaryAction}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            background: isFormModal ? theme.colors.primary : '#ef4444',
            color: isFormModal ? '#0b1224' : 'white',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {primaryLabel}
        </button>
      </>
    );
  })();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          [rtl ? 'left' : 'right']: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '12px',
          borderRadius: '8px',
          border: `2px solid ${theme.colors.primary}`,
          background: `${theme.colors.primary}20`,
          color: theme.colors.primary,
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
        title={rtl ? 'פתח פאנל' : 'Open Panel'}
      >
        {rtl ? '◀' : '▶'}
      </button>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          [rtl ? 'left' : 'right']: 0,
          top: 0,
          bottom: 0,
          width: '360px',
          background: theme.mode === 'dark' ? '#1a1a2e' : '#f5f5f5',
          borderLeft: rtl ? 'none' : `1px solid ${theme.colors.border}`,
          borderRight: rtl ? `1px solid ${theme.colors.border}` : 'none',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          direction: rtl ? 'rtl' : 'ltr',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.2)',
        }}
      >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
          {rtl ? 'פאנל ניהול' : 'Management Panel'}
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.text,
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        {(['snapshots', 'templates', 'sessions', 'themes'] as PanelView[]).map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: currentView === view ? `${theme.colors.primary}30` : 'transparent',
              borderBottom:
                currentView === view ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
              color: currentView === view ? theme.colors.primary : theme.colors.text,
              fontSize: '13px',
              fontWeight: currentView === view ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {view === 'snapshots' && (rtl ? '📸 צילומים' : '📸 Snapshots')}
            {view === 'templates' && (rtl ? '📋 תבניות' : '📋 Templates')}
            {view === 'sessions' && (rtl ? '💼 סשנים' : '💼 Sessions')}
            {view === 'themes' && (rtl ? '🎨 ערכות' : '🎨 Themes')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Snapshots View */}
        {currentView === 'snapshots' && (
          <div>
            <button
              onClick={handleCreateSnapshot}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '8px',
                border: `2px dashed ${theme.colors.primary}`,
                background: `${theme.colors.primary}10`,
                color: theme.colors.primary,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              + {rtl ? 'צור Snapshot חדש' : 'Create New Snapshot'}
            </button>

            {snapshots.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: theme.colors.text,
                  opacity: 0.5,
                  fontSize: '14px',
                }}
              >
                {rtl ? 'אין Snapshots שמורים' : 'No saved snapshots'}
              </div>
            ) : (
              snapshots
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((snapshot) => (
                  <div
                    key={snapshot.id}
                    style={{
                      padding: '12px',
                      marginBottom: '12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        color: theme.colors.text,
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}
                    >
                      {snapshot.name}
                    </div>
                    {snapshot.description && (
                      <div
                        style={{
                          color: theme.colors.text,
                          opacity: 0.7,
                          fontSize: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        {snapshot.description}
                      </div>
                    )}
                    <div
                      style={{
                        color: theme.colors.text,
                        opacity: 0.5,
                        fontSize: '11px',
                        marginBottom: '8px',
                      }}
                    >
                      {formatDate(snapshot.createdAt)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleRestoreSnapshot(snapshot.id)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#4ade80',
                          color: '#1a1a2e',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {rtl ? 'שחזר' : 'Restore'}
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(snapshot.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#ef4444',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {rtl ? 'מחק' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Templates View */}
        {currentView === 'templates' && (
          <div>
            <button
              onClick={handleSaveAsTemplate}
              disabled={isTemplateActionDisabled}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '8px',
                border: `2px dashed ${theme.colors.primary}`,
                background: `${theme.colors.primary}10`,
                color: theme.colors.primary,
                fontSize: '14px',
                fontWeight: '600',
                cursor: isTemplateActionDisabled ? 'not-allowed' : 'pointer',
                opacity: isTemplateActionDisabled ? 0.5 : 1,
              }}
            >
              + {rtl ? 'שמור פריט נבחר כ-Template' : 'Save Selected as Template'}
            </button>

            {templates.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: theme.colors.text,
                  opacity: 0.5,
                  fontSize: '14px',
                }}
              >
                {rtl ? 'אין Templates שמורים' : 'No saved templates'}
              </div>
            ) : (
              templates
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((template) => (
                  <div
                    key={template.id}
                    style={{
                      padding: '12px',
                      marginBottom: '12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        color: theme.colors.text,
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}
                    >
                      {template.name}
                    </div>
                    {template.description && (
                      <div
                        style={{
                          color: theme.colors.text,
                          opacity: 0.7,
                          fontSize: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        {template.description}
                      </div>
                    )}
                    <div
                      style={{
                        color: theme.colors.text,
                        opacity: 0.5,
                        fontSize: '11px',
                        marginBottom: '8px',
                      }}
                    >
                      {formatDate(template.createdAt)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApplyTemplate(template.id)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#3b82f6',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {rtl ? 'החל' : 'Apply'}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#ef4444',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {rtl ? 'מחק' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Sessions View */}
        {currentView === 'sessions' && (
          <div>
            <button
              onClick={handleCreateSession}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '8px',
                border: `2px dashed ${theme.colors.primary}`,
                background: `${theme.colors.primary}10`,
                color: theme.colors.primary,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              + {rtl ? 'צור Session חדש' : 'Create New Session'}
            </button>

            {sessions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: theme.colors.text,
                  opacity: 0.5,
                  fontSize: '14px',
                }}
              >
                {rtl ? 'אין Sessions נוספים' : 'No additional sessions'}
              </div>
            ) : (
              sessions
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((session) => (
                  <div
                    key={session.id}
                    style={{
                      padding: '12px',
                      marginBottom: '12px',
                      borderRadius: '8px',
                      background:
                        session.id === currentSessionId
                          ? `${theme.colors.primary}30`
                          : 'rgba(255,255,255,0.05)',
                      border:
                        session.id === currentSessionId
                          ? `2px solid ${theme.colors.primary}`
                          : `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        color: theme.colors.text,
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}
                    >
                      {session.name}
                      {session.id === currentSessionId && ' ⚡'}
                    </div>
                    {session.description && (
                      <div
                        style={{
                          color: theme.colors.text,
                          opacity: 0.7,
                          fontSize: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        {session.description}
                      </div>
                    )}
                    {session.id !== currentSessionId && (
                      <button
                        onClick={() => switchSession(session.id)}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#3b82f6',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {rtl ? 'עבור ל-Session זה' : 'Switch to this Session'}
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {/* Themes View */}
        {currentView === 'themes' && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: theme.colors.text,
              opacity: 0.5,
              fontSize: '14px',
            }}
          >
            {rtl ? 'מתכנן להוסיף עוד ערכות נושא...' : 'Theme switcher coming soon...'}
          </div>
        )}
      </div>
    </div>

      <Modal
        isOpen={!!modalType}
        onClose={resetModal}
        title={modalTitle}
        rtl={rtl}
        theme={theme}
        footer={modalFooter}
      >
        {modalContent}
      </Modal>
    </>
  );
};
