import { SandboxTheme } from '../types/core';

/**
 * Default themes for the app
 */

export const DEFAULT_DARK_THEME: SandboxTheme = {
  id: 'dark-default',
  name: 'Dark Default',
  mode: 'dark',
  colors: {
    primary: '#e94560',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    text: '#eaeaea',
    border: 'rgba(255,255,255,0.1)',
    levelColors: [
      '#e94560', // Level 0 - Red/Pink
      '#0f3460', // Level 1 - Deep Blue
      '#1b1b2f', // Level 2 - Dark Purple
      '#4a4a6a', // Level 3 - Medium Purple
      '#5a5a7a', // Level 4 - Light Purple
      '#6a6a8a', // Level 5 - Lighter Purple
    ],
  },
};

export const DEFAULT_LIGHT_THEME: SandboxTheme = {
  id: 'light-default',
  name: 'Light Default',
  mode: 'light',
  colors: {
    primary: '#e94560',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    text: '#2d3748',
    border: 'rgba(0,0,0,0.1)',
    levelColors: [
      '#e94560', // Level 0
      '#3b82f6', // Level 1
      '#8b5cf6', // Level 2
      '#ec4899', // Level 3
      '#f59e0b', // Level 4
      '#10b981', // Level 5
    ],
  },
};

export const HIGH_CONTRAST_THEME: SandboxTheme = {
  id: 'high-contrast',
  name: 'High Contrast',
  mode: 'high-contrast',
  colors: {
    primary: '#ffff00',
    background: '#000000',
    text: '#ffffff',
    border: '#ffffff',
    levelColors: [
      '#ffff00', // Level 0 - Yellow
      '#00ffff', // Level 1 - Cyan
      '#ff00ff', // Level 2 - Magenta
      '#00ff00', // Level 3 - Green
      '#ff8800', // Level 4 - Orange
      '#8800ff', // Level 5 - Purple
    ],
  },
};

export const THEMES: Record<string, SandboxTheme> = {
  [DEFAULT_DARK_THEME.id]: DEFAULT_DARK_THEME,
  [DEFAULT_LIGHT_THEME.id]: DEFAULT_LIGHT_THEME,
  [HIGH_CONTRAST_THEME.id]: HIGH_CONTRAST_THEME,
};
