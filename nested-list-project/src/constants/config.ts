/**
 * App configuration constants
 */

export const APP_CONFIG = {
  // Core constraints
  MAX_DEPTH: 6, // 0-5 levels
  MIN_DEPTH: 0,

  // Storage
  STORAGE_KEY: 'nested-list-sandbox-state',
  AUTO_SAVE_INTERVAL: 5000, // 5 seconds

  // UI
  ANIMATION_DURATION: 300, // milliseconds
  DEBOUNCE_DELAY: 300,

  // Limits
  MAX_TITLE_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_SNAPSHOTS: 50,
  MAX_HISTORY_ITEMS: 100,

  // Default values
  DEFAULT_VIEW_MODE: 'outline' as const,
  DEFAULT_RTL: true, // Hebrew by default
  DEFAULT_THEME_ID: 'dark-default',
  DEFAULT_SHORTCUTS_ID: 'default',
};

export const VIEW_MODE_LABELS: Record<string, string> = {
  outline: 'תצוגת מתאר',
  board: 'תצוגת לוח',
  tree: 'תצוגת עץ',
  timeline: 'ציר זמן',
  minimal: 'תצוגה מינימלית',
};
