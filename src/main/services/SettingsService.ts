/**
 * SettingsService - Application settings management
 *
 * Stores user preferences in a JSON file
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { AppSettings } from '../../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  autoSaveInterval: 500, // ms
  syncInterval: 30000, // ms (30 seconds)
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  defaultHighlightColor: '#ffeb3b',
  showLineNumbers: true,
  wordWrap: true,
};

export class SettingsService {
  private settingsPath: string;
  private settings: AppSettings;

  constructor(userDataPath: string) {
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.settings = { ...DEFAULT_SETTINGS };
  }

  /**
   * Load settings from disk
   */
  async load(): Promise<AppSettings> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      const savedSettings = JSON.parse(data);

      // Merge with defaults to handle new settings
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...savedSettings,
      };

      console.log('Settings loaded:', this.settingsPath);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        // File doesn't exist, use defaults and save
        console.log('No settings file found, using defaults');
        await this.save();
      } else {
        console.error('Error loading settings:', error);
      }
    }

    return this.settings;
  }

  /**
   * Save settings to disk
   */
  async save(): Promise<void> {
    try {
      const data = JSON.stringify(this.settings, null, 2);
      await fs.writeFile(this.settingsPath, data, 'utf-8');
      console.log('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get current settings
   */
  get(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Update settings (partial update)
   */
  async update(updates: Partial<AppSettings>): Promise<AppSettings> {
    this.settings = {
      ...this.settings,
      ...updates,
    };

    await this.save();
    return this.get();
  }

  /**
   * Reset to default settings
   */
  async reset(): Promise<AppSettings> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.save();
    return this.get();
  }
}
