import { SandboxShortcutsProfile } from '../types/core';

/**
 * Default keyboard shortcuts profiles
 */

export const DEFAULT_SHORTCUTS: SandboxShortcutsProfile = {
  id: 'default',
  name: 'Default',
  shortcuts: {
    // Navigation
    'navigate.up': 'ArrowUp',
    'navigate.down': 'ArrowDown',
    'navigate.left': 'ArrowLeft',
    'navigate.right': 'ArrowRight',
    'navigate.levelUp': 'Control+ArrowUp',
    'navigate.levelDown': 'Control+ArrowDown',

    // Actions
    'node.create': 'Enter',
    'node.createSibling': 'Shift+Enter',
    'node.delete': 'Control+Backspace',
    'node.duplicate': 'Control+d',
    'node.edit': 'F2',
    'node.toggleCollapse': 'Space',
    'node.indent': 'Tab',
    'node.outdent': 'Shift+Tab',

    // Selection
    'select.all': 'Control+a',
    'select.toggle': 'Control+Click',
    'select.range': 'Shift+Click',

    // View
    'view.focusMode': 'Control+Shift+f',
    'view.zoomIn': 'Alt+DoubleClick',
    'view.zoomOut': 'Escape',

    // System
    'command.palette': 'Control+k',
    'search.open': 'Control+Shift+f',
    'undo': 'Control+z',
    'redo': 'Control+Shift+z',

    // Export/Import
    'export.json': 'Control+e',
    'import.json': 'Control+i',
  },
};

export const VIM_SHORTCUTS: SandboxShortcutsProfile = {
  id: 'vim',
  name: 'Vim-like',
  shortcuts: {
    'navigate.up': 'k',
    'navigate.down': 'j',
    'navigate.left': 'h',
    'navigate.right': 'l',
    'node.create': 'o',
    'node.createSibling': 'O',
    'node.delete': 'dd',
    'node.edit': 'i',
    'node.toggleCollapse': 'za',
    'command.palette': ':',
    'view.focusMode': 'zz',
    'undo': 'u',
    'redo': 'Control+r',
  },
};

export const SHORTCUTS_PROFILES: Record<string, SandboxShortcutsProfile> = {
  [DEFAULT_SHORTCUTS.id]: DEFAULT_SHORTCUTS,
  [VIM_SHORTCUTS.id]: VIM_SHORTCUTS,
};
