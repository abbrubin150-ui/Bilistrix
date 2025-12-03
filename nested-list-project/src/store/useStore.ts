import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  AppState,
  ListNode,
  ListNodeId,
  SandboxSession,
  ViewMode,
  FilterConfig,
  Template,
  Snapshot,
} from '../types/core';
import {
  createNode,
  generateId,
  getAllChildren,
  cloneSubtree,
  canMoveNode,
} from '../utils/nodeHelpers';
import { DEFAULT_DARK_THEME } from '../constants/themes';
import { DEFAULT_SHORTCUTS } from '../constants/shortcuts';
import { APP_CONFIG } from '../constants/config';
import { useToastStore } from './useToastStore';

/**
 * Initial state
 */
const createInitialSession = (): SandboxSession => ({
  id: generateId(),
  name: 'Main Session',
  description: 'Default working session',
  viewMode: APP_CONFIG.DEFAULT_VIEW_MODE,
  rtl: APP_CONFIG.DEFAULT_RTL,
  rules: [],
  selectedNodeIds: [],
  theme: DEFAULT_DARK_THEME,
  shortcutsProfile: DEFAULT_SHORTCUTS,
  historyEnabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const initialState: AppState = {
  nodes: {},
  rootNodeIds: [],
  currentSession: createInitialSession(),
  sessions: {},
  templates: {},
  snapshots: {},
  plugins: [],
  filterConfig: {},
  commandPaletteOpen: false,
  history: {
    past: [],
    future: [],
  },
};

const clampLevel = (level: number): number => {
  if (!Number.isFinite(level)) return 0;
  return Math.min(APP_CONFIG.MAX_DEPTH - 1, Math.max(0, Math.trunc(level)));
};

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
};

const sanitizeTheme = (value: unknown) => {
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).name === 'string' &&
    (value as any).colors &&
    typeof (value as any).colors === 'object'
  ) {
    const colors = (value as any).colors;
    if (
      typeof colors.primary === 'string' &&
      typeof colors.background === 'string' &&
      typeof colors.text === 'string' &&
      typeof colors.border === 'string' &&
      Array.isArray(colors.levelColors)
    ) {
      return value as SandboxSession['theme'];
    }
  }
  return DEFAULT_DARK_THEME;
};

const sanitizeShortcuts = (value: unknown) => {
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).name === 'string' &&
    (value as any).shortcuts &&
    typeof (value as any).shortcuts === 'object'
  ) {
    return value as SandboxSession['shortcutsProfile'];
  }
  return DEFAULT_SHORTCUTS;
};

const sanitizeNode = (raw: any): ListNode => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid node format');
  }

  const now = Date.now();
  const id = typeof raw.id === 'string' ? raw.id : generateId();
  const level = clampLevel(typeof raw.level === 'number' ? raw.level : 0);

  return {
    id,
    parentId: typeof raw.parentId === 'string' ? raw.parentId : null,
    childrenIds: sanitizeStringArray(raw.childrenIds),
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : undefined,
    level,
    colorSlot:
      typeof raw.colorSlot === 'number' && Number.isFinite(raw.colorSlot)
        ? raw.colorSlot
        : undefined,
    icon: typeof raw.icon === 'string' ? raw.icon : undefined,
    isCollapsed: typeof raw.isCollapsed === 'boolean' ? raw.isCollapsed : false,
    isDone: typeof raw.isDone === 'boolean' ? raw.isDone : undefined,
    isPinned: typeof raw.isPinned === 'boolean' ? raw.isPinned : undefined,
    isHighlighted:
      typeof raw.isHighlighted === 'boolean' ? raw.isHighlighted : undefined,
    sandboxProps:
      raw.sandboxProps && typeof raw.sandboxProps === 'object'
        ? (raw.sandboxProps as Record<string, any>)
        : undefined,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt:
      typeof raw.updatedAt === 'number'
        ? raw.updatedAt
        : typeof raw.createdAt === 'number'
        ? raw.createdAt
        : now,
  };
};

const sanitizeNodesMap = (value: unknown): Record<ListNodeId, ListNode> => {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object') {
    throw new Error('Nodes must be an object');
  }

  const nodes: Record<ListNodeId, ListNode> = {};
  Object.entries(value as Record<string, any>).forEach(([key, nodeValue]) => {
    const node = sanitizeNode({ id: key, ...nodeValue });
    nodes[node.id] = node;
  });

  return nodes;
};

const sanitizeSession = (
  value: unknown,
  nodes: Record<ListNodeId, ListNode>
): SandboxSession => {
  const base = createInitialSession();
  if (!value || typeof value !== 'object') return base;

  const selectedNodeIds = sanitizeStringArray((value as any).selectedNodeIds).filter(
    (id) => !!nodes[id]
  );

  return {
    ...base,
    id: typeof (value as any).id === 'string' ? (value as any).id : base.id,
    name:
      typeof (value as any).name === 'string' ? (value as any).name : base.name,
    description:
      typeof (value as any).description === 'string'
        ? (value as any).description
        : base.description,
    viewMode:
      typeof (value as any).viewMode === 'string'
        ? ((value as any).viewMode as typeof base.viewMode)
        : base.viewMode,
    rtl: typeof (value as any).rtl === 'boolean' ? (value as any).rtl : base.rtl,
    rules: Array.isArray((value as any).rules)
      ? ((value as any).rules as SandboxSession['rules'])
      : base.rules,
    focusedNodeId:
      typeof (value as any).focusedNodeId === 'string'
        ? (value as any).focusedNodeId
        : undefined,
    selectedNodeIds,
    focusPath: sanitizeStringArray((value as any).focusPath),
    theme: sanitizeTheme((value as any).theme),
    shortcutsProfile: sanitizeShortcuts((value as any).shortcutsProfile),
    historyEnabled:
      typeof (value as any).historyEnabled === 'boolean'
        ? (value as any).historyEnabled
        : true,
    createdAt:
      typeof (value as any).createdAt === 'number'
        ? (value as any).createdAt
        : base.createdAt,
    updatedAt:
      typeof (value as any).updatedAt === 'number'
        ? (value as any).updatedAt
        : base.updatedAt,
  };
};

const sanitizeTemplates = (value: unknown): Record<string, Template> => {
  if (!value || typeof value !== 'object') return {};
  const templates: Record<string, Template> = {};
  Object.entries(value as Record<string, any>).forEach(([key, templateValue]) => {
    if (!templateValue || typeof templateValue !== 'object') return;
    const now = Date.now();
    const id = typeof templateValue.id === 'string' ? templateValue.id : key;
    if (typeof id !== 'string' || typeof templateValue.rootNodeId !== 'string') return;

    templates[id] = {
      id,
      name: typeof templateValue.name === 'string' ? templateValue.name : 'Template',
      description:
        typeof templateValue.description === 'string'
          ? templateValue.description
          : undefined,
      rootNodeId: templateValue.rootNodeId,
      tags: sanitizeStringArray(templateValue.tags),
      createdAt:
        typeof templateValue.createdAt === 'number' ? templateValue.createdAt : now,
    };
  });
  return templates;
};

const sanitizeSnapshots = (value: unknown): Record<string, Snapshot> => {
  if (!value || typeof value !== 'object') return {};
  const snapshots: Record<string, Snapshot> = {};

  Object.entries(value as Record<string, any>).forEach(([key, snapshotValue]) => {
    if (!snapshotValue || typeof snapshotValue !== 'object') return;
    const now = Date.now();
    const id = typeof (snapshotValue as any).id === 'string' ? (snapshotValue as any).id : key;
    const sessionId = (snapshotValue as any).sessionId;

    if (typeof id !== 'string' || typeof sessionId !== 'string') return;

    const nodes = sanitizeNodesMap((snapshotValue as any).nodes);
    const rootNodeIds = sanitizeStringArray((snapshotValue as any).rootNodeIds).filter(
      (rid) => !!nodes[rid]
    );

    snapshots[id] = {
      id,
      name:
        typeof (snapshotValue as any).name === 'string'
          ? (snapshotValue as any).name
          : 'Snapshot',
      description:
        typeof (snapshotValue as any).description === 'string'
          ? (snapshotValue as any).description
          : undefined,
      sessionId,
      nodes,
      rootNodeIds,
      createdAt:
        typeof (snapshotValue as any).createdAt === 'number'
          ? (snapshotValue as any).createdAt
          : now,
    };
  });

  return snapshots;
};

const parseImportData = (jsonData: string) => {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonData);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Imported data must be an object');
  }

  const nodes = sanitizeNodesMap(parsed.nodes);
  if (parsed.rootNodeIds !== undefined && !Array.isArray(parsed.rootNodeIds)) {
    throw new Error('rootNodeIds must be an array');
  }
  const rootNodeIds = sanitizeStringArray(parsed.rootNodeIds).filter((id) => !!nodes[id]);
  const session = sanitizeSession(parsed.session, nodes);
  const templates = sanitizeTemplates(parsed.templates);
  const snapshots = sanitizeSnapshots(parsed.snapshots);

  return { nodes, rootNodeIds, session, templates, snapshots };
};

/**
 * Store actions interface
 */
interface StoreActions {
  // Node CRUD
  createNode: (parentId: ListNodeId | null, data?: Partial<ListNode>) => ListNode;
  updateNode: (id: ListNodeId, updates: Partial<ListNode>) => void;
  deleteNode: (id: ListNodeId) => void;
  moveNode: (nodeId: ListNodeId, newParentId: ListNodeId | null, position?: number) => void;
  duplicateNode: (id: ListNodeId) => void;

  // Node operations
  toggleCollapse: (id: ListNodeId) => void;
  toggleDone: (id: ListNodeId) => void;
  togglePin: (id: ListNodeId) => void;
  collapseAll: () => void;
  expandAll: () => void;
  collapseToLevel: (level: number) => void;

  // Selection
  selectNode: (id: ListNodeId, multi?: boolean) => void;
  deselectNode: (id: ListNodeId) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Focus
  setFocusNode: (id: ListNodeId | undefined) => void;
  zoomIn: (id: ListNodeId) => void;
  zoomOut: () => void;

  // Session management
  updateSession: (updates: Partial<SandboxSession>) => void;
  setViewMode: (mode: ViewMode) => void;
  setRTL: (rtl: boolean) => void;
  createSession: (name: string, description?: string) => void;
  switchSession: (id: string) => void;

  // Filter
  setFilter: (config: FilterConfig) => void;
  clearFilter: () => void;

  // Command Palette
  toggleCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Templates
  createTemplate: (nodeId: ListNodeId, name: string, description?: string) => void;
  applyTemplate: (templateId: string, parentId: ListNodeId | null) => void;
  deleteTemplate: (id: string) => void;

  // Snapshots
  createSnapshot: (name: string, description?: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  // Import/Export
  exportData: () => string;
  importData: (jsonData: string) => void;
  reset: () => void;
}

/**
 * Main store
 */
export const useStore = create<AppState & StoreActions>()(
  immer((set, get) => ({
    ...initialState,

    // Node CRUD
    createNode: (parentId, data = {}) => {
      const state = get();
      const parent = parentId ? state.nodes[parentId] : null;
      const level = parent ? parent.level + 1 : 0;

      if (level >= APP_CONFIG.MAX_DEPTH) {
        console.warn('Cannot create node: max depth reached');
        return null as any;
      }

      const newNode = createNode({ ...data, level, parentId });

      set((draft) => {
        draft.nodes[newNode.id] = newNode;

        if (parentId && draft.nodes[parentId]) {
          draft.nodes[parentId].childrenIds.push(newNode.id);
          draft.nodes[parentId].isCollapsed = false; // Auto-expand parent
        } else {
          draft.rootNodeIds.push(newNode.id);
        }
      });

      get().saveHistory();
      return newNode;
    },

    updateNode: (id, updates) => {
      set((draft) => {
        if (draft.nodes[id]) {
          Object.assign(draft.nodes[id], {
            ...updates,
            updatedAt: Date.now(),
          });
        }
      });
    },

    deleteNode: (id) => {
      const state = get();
      const node = state.nodes[id];
      if (!node) return;

      // Get all descendants
      const toDelete = [id, ...getAllChildren(id, state.nodes).map((n) => n.id)];

      set((draft) => {
        // Remove from parent's children
        if (node.parentId && draft.nodes[node.parentId]) {
          const parent = draft.nodes[node.parentId];
          parent.childrenIds = parent.childrenIds.filter((cid) => cid !== id);
        } else {
          // Remove from root
          draft.rootNodeIds = draft.rootNodeIds.filter((rid) => rid !== id);
        }

        // Delete all nodes
        toDelete.forEach((nid) => {
          delete draft.nodes[nid];
        });

        // Clear selection if deleted
        draft.currentSession.selectedNodeIds =
          draft.currentSession.selectedNodeIds.filter(
            (sid) => !toDelete.includes(sid)
          );

        // Clear focus if deleted
        if (
          draft.currentSession.focusedNodeId &&
          toDelete.includes(draft.currentSession.focusedNodeId)
        ) {
          draft.currentSession.focusedNodeId = undefined;
        }
      });

      get().saveHistory();
    },

    moveNode: (nodeId, newParentId, position) => {
      const state = get();

      if (!canMoveNode(nodeId, newParentId, state.nodes, APP_CONFIG.MAX_DEPTH)) {
        console.warn('Cannot move node: invalid move');
        return;
      }

      const node = state.nodes[nodeId];
      if (!node) return;

      set((draft) => {
        // Remove from old parent
        if (node.parentId && draft.nodes[node.parentId]) {
          const oldParent = draft.nodes[node.parentId];
          oldParent.childrenIds = oldParent.childrenIds.filter(
            (cid) => cid !== nodeId
          );
        } else {
          draft.rootNodeIds = draft.rootNodeIds.filter((rid) => rid !== nodeId);
        }

        // Update node's parent and level
        const newLevel = newParentId ? draft.nodes[newParentId].level + 1 : 0;
        draft.nodes[nodeId].parentId = newParentId;
        draft.nodes[nodeId].level = newLevel;

        // Update all descendants' levels
        const updateLevels = (id: ListNodeId, baseLevel: number) => {
          const n = draft.nodes[id];
          if (!n) return;
          n.level = baseLevel;
          n.childrenIds.forEach((cid) => updateLevels(cid, baseLevel + 1));
        };
        node.childrenIds.forEach((cid) => updateLevels(cid, newLevel + 1));

        // Add to new parent
        if (newParentId && draft.nodes[newParentId]) {
          const newParent = draft.nodes[newParentId];
          if (position !== undefined) {
            newParent.childrenIds.splice(position, 0, nodeId);
          } else {
            newParent.childrenIds.push(nodeId);
          }
        } else {
          if (position !== undefined) {
            draft.rootNodeIds.splice(position, 0, nodeId);
          } else {
            draft.rootNodeIds.push(nodeId);
          }
        }
      });

      get().saveHistory();
    },

    duplicateNode: (id) => {
      const state = get();
      const node = state.nodes[id];
      if (!node) return;

      const { node: clonedNode, newNodes } = cloneSubtree(
        id,
        state.nodes,
        node.parentId
      );

      set((draft) => {
        // Add all new nodes
        Object.assign(draft.nodes, newNodes);

        // Add to parent or root
        if (node.parentId && draft.nodes[node.parentId]) {
          const parent = draft.nodes[node.parentId];
          const index = parent.childrenIds.indexOf(id);
          parent.childrenIds.splice(index + 1, 0, clonedNode.id);
        } else {
          const index = draft.rootNodeIds.indexOf(id);
          draft.rootNodeIds.splice(index + 1, 0, clonedNode.id);
        }
      });

      get().saveHistory();
    },

    // Node operations
    toggleCollapse: (id) => {
      set((draft) => {
        if (draft.nodes[id]) {
          draft.nodes[id].isCollapsed = !draft.nodes[id].isCollapsed;
        }
      });
    },

    toggleDone: (id) => {
      set((draft) => {
        if (draft.nodes[id]) {
          draft.nodes[id].isDone = !draft.nodes[id].isDone;
        }
      });
    },

    togglePin: (id) => {
      set((draft) => {
        if (draft.nodes[id]) {
          draft.nodes[id].isPinned = !draft.nodes[id].isPinned;
        }
      });
    },

    collapseAll: () => {
      set((draft) => {
        Object.values(draft.nodes).forEach((node) => {
          if (node.childrenIds.length > 0) {
            node.isCollapsed = true;
          }
        });
      });
    },

    expandAll: () => {
      set((draft) => {
        Object.values(draft.nodes).forEach((node) => {
          node.isCollapsed = false;
        });
      });
    },

    collapseToLevel: (level) => {
      set((draft) => {
        Object.values(draft.nodes).forEach((node) => {
          if (node.level >= level && node.childrenIds.length > 0) {
            node.isCollapsed = true;
          } else {
            node.isCollapsed = false;
          }
        });
      });
    },

    // Selection
    selectNode: (id, multi = false) => {
      set((draft) => {
        if (multi) {
          if (!draft.currentSession.selectedNodeIds.includes(id)) {
            draft.currentSession.selectedNodeIds.push(id);
          }
        } else {
          draft.currentSession.selectedNodeIds = [id];
        }
      });
    },

    deselectNode: (id) => {
      set((draft) => {
        draft.currentSession.selectedNodeIds =
          draft.currentSession.selectedNodeIds.filter((sid) => sid !== id);
      });
    },

    clearSelection: () => {
      set((draft) => {
        draft.currentSession.selectedNodeIds = [];
      });
    },

    selectAll: () => {
      set((draft) => {
        draft.currentSession.selectedNodeIds = Object.keys(draft.nodes);
      });
    },

    // Focus
    setFocusNode: (id) => {
      set((draft) => {
        draft.currentSession.focusedNodeId = id;
      });
    },

    zoomIn: (id) => {
      const state = get();
      const node = state.nodes[id];
      if (!node) return;

      set((draft) => {
        draft.currentSession.focusedNodeId = id;
        // Build path for breadcrumb
        const path: string[] = [];
        let current = node;
        while (current) {
          path.unshift(current.id);
          current = current.parentId ? draft.nodes[current.parentId] : null;
        }
        draft.currentSession.focusPath = path;
      });
    },

    zoomOut: () => {
      set((draft) => {
        const path = draft.currentSession.focusPath;
        if (path && path.length > 1) {
          // Go up one level
          draft.currentSession.focusPath = path.slice(0, -1);
          draft.currentSession.focusedNodeId = path[path.length - 2];
        } else {
          // Exit focus mode
          draft.currentSession.focusedNodeId = undefined;
          draft.currentSession.focusPath = undefined;
        }
      });
    },

    // Session management
    updateSession: (updates) => {
      set((draft) => {
        Object.assign(draft.currentSession, {
          ...updates,
          updatedAt: Date.now(),
        });
      });
    },

    setViewMode: (mode) => {
      set((draft) => {
        draft.currentSession.viewMode = mode;
        draft.currentSession.updatedAt = Date.now();
      });
    },

    setRTL: (rtl) => {
      set((draft) => {
        draft.currentSession.rtl = rtl;
      });
    },

    createSession: (name, description) => {
      const newSession: SandboxSession = {
        id: generateId(),
        name,
        description,
        viewMode: APP_CONFIG.DEFAULT_VIEW_MODE,
        rtl: APP_CONFIG.DEFAULT_RTL,
        rules: [],
        selectedNodeIds: [],
        theme: DEFAULT_DARK_THEME,
        shortcutsProfile: DEFAULT_SHORTCUTS,
        historyEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      set((draft) => {
        draft.sessions[newSession.id] = newSession;
      });
    },

    switchSession: (id) => {
      const state = get();
      const session = state.sessions[id];
      if (!session) return;

      set((draft) => {
        draft.currentSession = { ...session };
      });
    },

    // Filter
    setFilter: (config) => {
      set((draft) => {
        draft.filterConfig = config;
      });
    },

    clearFilter: () => {
      set((draft) => {
        draft.filterConfig = {};
      });
    },

    // Command Palette
    toggleCommandPalette: () => {
      set((draft) => {
        draft.commandPaletteOpen = !draft.commandPaletteOpen;
      });
    },

    closeCommandPalette: () => {
      set((draft) => {
        draft.commandPaletteOpen = false;
      });
    },

    // Templates
    createTemplate: (nodeId, name, description) => {
      const state = get();
      const node = state.nodes[nodeId];
      if (!node) return;

      const template: Template = {
        id: generateId(),
        name,
        description,
        rootNodeId: nodeId,
        createdAt: Date.now(),
      };

      set((draft) => {
        draft.templates[template.id] = template;
      });
    },

    applyTemplate: (templateId, parentId) => {
      const state = get();
      const template = state.templates[templateId];
      if (!template) return;

      const { node: clonedNode, newNodes } = cloneSubtree(
        template.rootNodeId,
        state.nodes,
        parentId
      );

      set((draft) => {
        Object.assign(draft.nodes, newNodes);

        if (parentId && draft.nodes[parentId]) {
          draft.nodes[parentId].childrenIds.push(clonedNode.id);
        } else {
          draft.rootNodeIds.push(clonedNode.id);
        }
      });

      get().saveHistory();
    },

    deleteTemplate: (id) => {
      set((draft) => {
        delete draft.templates[id];
      });
    },

    // Snapshots
    createSnapshot: (name, description) => {
      const state = get();

      const snapshot: Snapshot = {
        id: generateId(),
        name,
        description,
        sessionId: state.currentSession.id,
        nodes: { ...state.nodes },
        rootNodeIds: [...state.rootNodeIds],
        createdAt: Date.now(),
      };

      set((draft) => {
        draft.snapshots[snapshot.id] = snapshot;

        // Limit number of snapshots
        const snapshotList = Object.values(draft.snapshots).sort(
          (a, b) => b.createdAt - a.createdAt
        );
        if (snapshotList.length > APP_CONFIG.MAX_SNAPSHOTS) {
          const toDelete = snapshotList.slice(APP_CONFIG.MAX_SNAPSHOTS);
          toDelete.forEach((s) => delete draft.snapshots[s.id]);
        }
      });
    },

    restoreSnapshot: (id) => {
      const state = get();
      const snapshot = state.snapshots[id];
      if (!snapshot) return;

      set((draft) => {
        draft.nodes = { ...snapshot.nodes };
        draft.rootNodeIds = [...snapshot.rootNodeIds];
      });

      get().saveHistory();
    },

    deleteSnapshot: (id) => {
      set((draft) => {
        delete draft.snapshots[id];
      });
    },

    // History
    saveHistory: () => {
      const state = get();
      if (!state.currentSession.historyEnabled) return;

      set((draft) => {
        draft.history.past.push({
          nodes: { ...state.nodes },
          rootNodeIds: [...state.rootNodeIds],
        });

        // Limit history size
        if (draft.history.past.length > APP_CONFIG.MAX_HISTORY_ITEMS) {
          draft.history.past.shift();
        }

        // Clear future on new action
        draft.history.future = [];
      });
    },

    undo: () => {
      const state = get();
      if (state.history.past.length === 0) return;

      const previous = state.history.past[state.history.past.length - 1];

      set((draft) => {
        // Save current to future
        draft.history.future.push({
          nodes: { ...state.nodes },
          rootNodeIds: [...state.rootNodeIds],
        });

        // Restore previous
        draft.nodes = { ...previous.nodes };
        draft.rootNodeIds = [...previous.rootNodeIds];

        // Remove from past
        draft.history.past.pop();
      });
    },

    redo: () => {
      const state = get();
      if (state.history.future.length === 0) return;

      const next = state.history.future[state.history.future.length - 1];

      set((draft) => {
        // Save current to past
        draft.history.past.push({
          nodes: { ...state.nodes },
          rootNodeIds: [...state.rootNodeIds],
        });

        // Restore next
        draft.nodes = { ...next.nodes };
        draft.rootNodeIds = [...next.rootNodeIds];

        // Remove from future
        draft.history.future.pop();
      });
    },

    // Import/Export
    exportData: () => {
      const state = get();
      try {
        return JSON.stringify(
          {
            nodes: state.nodes,
            rootNodeIds: state.rootNodeIds,
            session: state.currentSession,
            templates: state.templates,
            snapshots: state.snapshots,
          },
          null,
          2
        );
      } catch (error) {
        console.error('Failed to export data:', error);
        const rtl = state.currentSession.rtl;
        useToastStore.getState().addToast(
          rtl ? 'ייצוא נתונים נכשל' : 'Failed to export data.',
          'error'
        );
        throw error instanceof Error ? error : new Error('Export failed');
      }
    },

    importData: (jsonData) => {
      const rtl = get().currentSession.rtl;
      try {
        const parsed = parseImportData(jsonData);
        set((draft) => {
          draft.nodes = parsed.nodes;
          draft.rootNodeIds = parsed.rootNodeIds;
          draft.currentSession = parsed.session;
          draft.templates = parsed.templates;
          draft.snapshots = parsed.snapshots;
        });
        get().saveHistory();
      } catch (error) {
        console.error('Failed to import data:', error);
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Failed to import data';
        useToastStore.getState().addToast(
          rtl
            ? `ייבוא נתונים נכשל: ${message}`
            : `Import failed: ${message}`,
          'error'
        );
        throw error instanceof Error ? error : new Error('Import failed');
      }
    },

    reset: () => {
      set(initialState);
    },
  }))
);
