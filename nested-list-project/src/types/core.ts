/**
 * Core Types for Nested List Sandbox App
 * Following the specification for maximum flexibility with minimal constraints
 */

export type ListNodeId = string;

/**
 * Base ListNode - The fundamental data structure
 * Constraint: Max depth of 6 levels (0-5)
 */
export interface ListNode {
  id: ListNodeId;
  parentId: ListNodeId | null;
  childrenIds: ListNodeId[];

  // Content
  title: string;
  description?: string;

  // Metadata
  level: number; // 0-5 (6 levels total)
  colorSlot?: number; // Color index per level/mode
  icon?: string; // Unicode icon or icon name

  // Interactive state
  isCollapsed: boolean; // For accordion
  isDone?: boolean; // Optional checkbox
  isPinned?: boolean; // Pinning
  isHighlighted?: boolean; // Temporary highlight

  // Sandbox props - open field for extensions
  sandboxProps?: Record<string, any>;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * View modes for displaying the same tree in different ways
 */
export type ViewMode = 'outline' | 'board' | 'tree' | 'timeline' | 'minimal';

/**
 * Theme configuration
 */
export interface SandboxTheme {
  id: string;
  name: string;
  mode: 'light' | 'dark' | 'high-contrast';
  colors: {
    primary: string;
    background: string;
    text: string;
    border: string;
    levelColors: string[]; // 6 colors for 6 levels
  };
}

/**
 * Keyboard shortcuts profile
 */
export interface SandboxShortcutsProfile {
  id: string;
  name: string;
  shortcuts: Record<string, string>; // action -> key combination
}

/**
 * Base rule interface for dynamic behavior
 */
export interface SandboxRule {
  id: string;
  type: string;
  name: string;
  description?: string;
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * Session - Represents a working state over the tree
 */
export interface SandboxSession {
  id: string;
  name: string;
  description?: string;

  // View state
  viewMode: ViewMode;
  rtl: boolean; // Full RTL support

  // Dynamic rules
  rules: SandboxRule[];

  // Selection/Focus state
  focusedNodeId?: string;
  selectedNodeIds: string[];
  focusPath?: string[]; // Breadcrumb path for zoom mode

  // UI settings
  theme: SandboxTheme;
  shortcutsProfile: SandboxShortcutsProfile;

  // History
  historyEnabled: boolean;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Template - Saved subtree structure
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  rootNodeId: string;
  tags?: string[];
  createdAt: number;
}

/**
 * Snapshot - Saved state of tree + session
 */
export interface Snapshot {
  id: string;
  name: string;
  description?: string;
  sessionId: string;
  nodes: Record<ListNodeId, ListNode>;
  rootNodeIds: ListNodeId[];
  createdAt: number;
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  searchText?: string;
  levels?: number[];
  isDone?: boolean;
  minChildren?: number;
  maxChildren?: number;
  tags?: string[];
}

/**
 * Plugin interface for extensibility
 */
export interface SandboxPlugin {
  id: string;
  name: string;
  version: string;
  description?: string;

  // Lifecycle hooks
  onNodeCreate?(node: ListNode, ctx: SandboxContext): void;
  onNodeUpdate?(prev: ListNode, next: ListNode, ctx: SandboxContext): void;
  onNodeDelete?(node: ListNode, ctx: SandboxContext): void;
  onSessionChange?(session: SandboxSession, ctx: SandboxContext): void;

  // UI injection
  renderNodeExtras?(node: ListNode, ctx: SandboxContext): React.ReactNode;
  renderSidebar?(ctx: SandboxContext): React.ReactNode;
  renderToolbar?(ctx: SandboxContext): React.ReactNode;
}

/**
 * Context provided to plugins
 */
export interface SandboxContext {
  // State access
  nodes: Record<ListNodeId, ListNode>;
  rootNodeIds: ListNodeId[];
  session: SandboxSession;

  // Actions
  updateNode: (id: ListNodeId, updates: Partial<ListNode>) => void;
  deleteNode: (id: ListNodeId) => void;
  createNode: (parentId: ListNodeId | null, data: Partial<ListNode>) => ListNode;

  // Session actions
  updateSession: (updates: Partial<SandboxSession>) => void;

  // Queries
  getNode: (id: ListNodeId) => ListNode | undefined;
  getChildren: (id: ListNodeId) => ListNode[];
  getParent: (id: ListNodeId) => ListNode | undefined;
  getPath: (id: ListNodeId) => ListNode[];
}

/**
 * App state - the main store structure
 */
export interface AppState {
  // Core data
  nodes: Record<ListNodeId, ListNode>;
  rootNodeIds: ListNodeId[];

  // Current session
  currentSession: SandboxSession;

  // Sessions management
  sessions: Record<string, SandboxSession>;

  // Templates
  templates: Record<string, Template>;

  // Snapshots
  snapshots: Record<string, Snapshot>;

  // Plugins
  plugins: SandboxPlugin[];

  // UI state
  filterConfig: FilterConfig;
  commandPaletteOpen: boolean;

  // History for undo/redo
  history: {
    past: Array<{ nodes: Record<ListNodeId, ListNode>; rootNodeIds: ListNodeId[] }>;
    future: Array<{ nodes: Record<ListNodeId, ListNode>; rootNodeIds: ListNodeId[] }>;
  };
}
