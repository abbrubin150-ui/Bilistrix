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
    },

    importData: (jsonData) => {
      try {
        const data = JSON.parse(jsonData);
        set((draft) => {
          if (data.nodes) draft.nodes = data.nodes;
          if (data.rootNodeIds) draft.rootNodeIds = data.rootNodeIds;
          if (data.session) draft.currentSession = data.session;
          if (data.templates) draft.templates = data.templates;
          if (data.snapshots) draft.snapshots = data.snapshots;
        });
        get().saveHistory();
      } catch (error) {
        console.error('Failed to import data:', error);
      }
    },

    reset: () => {
      set(initialState);
    },
  }))
);
