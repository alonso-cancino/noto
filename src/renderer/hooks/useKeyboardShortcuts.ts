/**
 * useKeyboardShortcuts - Global keyboard shortcut management
 *
 * Features:
 * - Register keyboard shortcuts
 * - Platform-specific modifiers (Cmd on Mac, Ctrl on Windows/Linux)
 * - Prevent conflicts with browser shortcuts
 * - Easy shortcut registration
 */

import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac, Win key on Windows
  action: (event: KeyboardEvent) => void;
  description?: string;
}

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !shortcut.ctrl || event.ctrlKey;
        const shiftMatches = !shortcut.shift || event.shiftKey;
        const altMatches = !shortcut.alt || event.altKey;
        const metaMatches = !shortcut.meta || event.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          // Check that only the required modifiers are pressed
          const requiredCtrl = shortcut.ctrl ?? false;
          const requiredShift = shortcut.shift ?? false;
          const requiredAlt = shortcut.alt ?? false;
          const requiredMeta = shortcut.meta ?? false;

          if (
            event.ctrlKey === requiredCtrl &&
            event.shiftKey === requiredShift &&
            event.altKey === requiredAlt &&
            event.metaKey === requiredMeta
          ) {
            event.preventDefault();
            event.stopPropagation();
            shortcut.action(event);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [shortcuts]);
}

/**
 * Get the primary modifier key for the current platform
 */
export function getPrimaryModifier(): 'meta' | 'ctrl' {
  return isMac ? 'meta' : 'ctrl';
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: Omit<ShortcutConfig, 'action'>): string {
  const parts: string[] = [];

  if (shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.ctrl && !isMac) {
    parts.push('Ctrl');
  }
  if (shortcut.shift) {
    parts.push('⇧');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

/**
 * Standard shortcuts for the application
 */
export const SHORTCUTS = {
  // File operations
  NEW_FILE: {
    key: 'n',
    meta: true,
    description: 'New file',
  },
  SAVE: {
    key: 's',
    meta: true,
    description: 'Save file',
  },
  OPEN: {
    key: 'o',
    meta: true,
    description: 'Open file',
  },

  // Navigation
  COMMAND_PALETTE: {
    key: 'p',
    meta: true,
    description: 'Command palette',
  },
  SEARCH: {
    key: 'f',
    meta: true,
    shift: true,
    description: 'Search in files',
  },
  QUICK_OPEN: {
    key: 'p',
    meta: true,
    description: 'Quick open file',
  },

  // Editor
  TOGGLE_PREVIEW: {
    key: 'k',
    meta: true,
    shift: true,
    description: 'Toggle preview',
  },
  FIND_IN_FILE: {
    key: 'f',
    meta: true,
    description: 'Find in file',
  },

  // Tabs
  CLOSE_TAB: {
    key: 'w',
    meta: true,
    description: 'Close tab',
  },
  NEXT_TAB: {
    key: 'Tab',
    ctrl: true,
    description: 'Next tab',
  },
  PREV_TAB: {
    key: 'Tab',
    ctrl: true,
    shift: true,
    description: 'Previous tab',
  },

  // Settings
  SETTINGS: {
    key: ',',
    meta: true,
    description: 'Open settings',
  },
};
