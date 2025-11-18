/**
 * Settings - Application settings panel
 *
 * Features:
 * - Theme selection (dark/light)
 * - Editor preferences
 * - Auto-save interval
 * - Sync interval
 * - Default highlight color
 * - Font settings
 */

import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../../../shared/types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings when opened
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const currentSettings = await window.api['settings:get']();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await window.api['settings:set'](settings);
      // Show success message briefly
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setIsSaving(false);
    }
  };

  const handleChange = (key: keyof AppSettings, value: AppSettings[typeof key]) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [key]: value,
    });
  };

  if (!isOpen || !settings) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-vscode-bg border border-vscode-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vscode-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vscode-text">Settings</h2>
          <button
            onClick={onClose}
            className="text-vscode-text-secondary hover:text-vscode-text"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Appearance */}
          <section>
            <h3 className="text-md font-semibold text-vscode-text mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-vscode-text mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value as 'dark' | 'light')}
                  className="w-full px-3 py-2 bg-vscode-input text-vscode-text border border-vscode-border rounded focus:outline-none focus:border-vscode-accent"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-vscode-text mb-2">
                  Font Size: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-vscode-text mb-2">Font Family</label>
                <input
                  type="text"
                  value={settings.fontFamily}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 bg-vscode-input text-vscode-text border border-vscode-border rounded focus:outline-none focus:border-vscode-accent"
                />
              </div>
            </div>
          </section>

          {/* Editor */}
          <section>
            <h3 className="text-md font-semibold text-vscode-text mb-4">Editor</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm text-vscode-text">Show Line Numbers</label>
                  <span className="text-xs text-vscode-text-secondary">
                    Display line numbers in the editor
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showLineNumbers}
                  onChange={(e) => handleChange('showLineNumbers', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm text-vscode-text">Word Wrap</label>
                  <span className="text-xs text-vscode-text-secondary">
                    Wrap long lines in the editor
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) => handleChange('wordWrap', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>

              <div>
                <label className="block text-sm text-vscode-text mb-2">
                  Auto-save Interval: {settings.autoSaveInterval}ms
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={settings.autoSaveInterval}
                  onChange={(e) => handleChange('autoSaveInterval', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-vscode-text-secondary mt-1">
                  <span>100ms</span>
                  <span>2000ms</span>
                </div>
              </div>
            </div>
          </section>

          {/* PDF Annotations */}
          <section>
            <h3 className="text-md font-semibold text-vscode-text mb-4">PDF Annotations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-vscode-text mb-2">
                  Default Highlight Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.defaultHighlightColor}
                    onChange={(e) => handleChange('defaultHighlightColor', e.target.value)}
                    className="w-12 h-8 rounded border border-vscode-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.defaultHighlightColor}
                    onChange={(e) => handleChange('defaultHighlightColor', e.target.value)}
                    className="flex-1 px-3 py-2 bg-vscode-input text-vscode-text border border-vscode-border rounded focus:outline-none focus:border-vscode-accent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Sync (if Drive is enabled) */}
          {settings.driveFolderId && (
            <section>
              <h3 className="text-md font-semibold text-vscode-text mb-4">
                Sync
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-vscode-text mb-2">
                    Sync Interval: {settings.syncInterval / 1000}s
                  </label>
                  <input
                    type="range"
                    min="10000"
                    max="300000"
                    step="10000"
                    value={settings.syncInterval}
                    onChange={(e) => handleChange('syncInterval', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-vscode-text-secondary mt-1">
                    <span>10s</span>
                    <span>300s</span>
                  </div>
                </div>

                <div className="p-3 bg-vscode-input rounded">
                  <div className="text-sm text-vscode-text">
                    Syncing to: <span className="font-mono">{settings.driveFolderName || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vscode-border flex items-center justify-between">
          <div className="text-sm text-vscode-text-secondary">
            {isSaving && 'Saving...'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-vscode-text hover:bg-vscode-hover rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-vscode-accent text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
