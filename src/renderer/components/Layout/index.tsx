/**
 * Layout - Main application layout with Phase 7 features
 *
 * Phase 7 Features Integrated:
 * - Multiple tabs (PR-043)
 * - Command palette (PR-038)
 * - Global search (PR-036)
 * - Settings panel (PR-039)
 * - Keyboard shortcuts (PR-041)
 * - Recent files tracking (PR-044)
 * - Export functionality (PR-042)
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FileMetadata } from '../../../shared/types';
import { FileExplorer } from '../FileExplorer';
import { EditorPane } from './EditorPane';
import { StatusBar } from '../StatusBar';
import { TabBar } from '../TabBar';
import { CommandPalette } from '../CommandPalette';
import { GlobalSearch } from '../GlobalSearch';
import { Settings } from '../Settings';
import { RecentFiles } from '../RecentFiles';
import { useKeyboardShortcuts, SHORTCUTS } from '../../hooks/useKeyboardShortcuts';

interface Tab {
  file: FileMetadata;
  isDirty: boolean;
  wordCount: number;
  citationTarget?: {
    page: number;
    annotationId?: string;
  } | null;
}

export const Layout: React.FC = () => {
  // UI state
  const [sidebarVisible, _setSidebarVisible] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Tabs state
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);

  // Get active tab
  const activeTab = tabs.find((t) => t.file.path === activeTabPath) || null;

  // Handle file selection
  const handleFileSelect = async (file: FileMetadata) => {
    // Check if file is already open in a tab
    const existingTab = tabs.find((t) => t.file.path === file.path);

    if (existingTab) {
      // Switch to existing tab
      setActiveTabPath(file.path);
    } else {
      // Open new tab
      const newTab: Tab = {
        file,
        isDirty: false,
        wordCount: 0,
        citationTarget: null,
      };

      setTabs([...tabs, newTab]);
      setActiveTabPath(file.path);
    }

    // Track in recent files
    try {
      await window.api['recent:add'](file.path);
    } catch (error) {
      console.error('Failed to add to recent files:', error);
    }
  };

  // Handle tab close
  const handleTabClose = (filePath: string) => {
    const tabToClose = tabs.find((t) => t.file.path === filePath);

    // Confirm if file has unsaved changes
    if (tabToClose?.isDirty) {
      if (!confirm(`"${tabToClose.file.name}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    const newTabs = tabs.filter((t) => t.file.path !== filePath);
    setTabs(newTabs);

    // If closing active tab, switch to another tab
    if (filePath === activeTabPath) {
      if (newTabs.length > 0) {
        setActiveTabPath(newTabs[newTabs.length - 1].file.path);
      } else {
        setActiveTabPath(null);
      }
    }
  };

  // Handle tab switch
  const handleTabSelect = (filePath: string) => {
    setActiveTabPath(filePath);
  };

  // Handle editor state changes
  const handleEditorStateChange = (newWordCount: number, newIsDirty: boolean) => {
    if (!activeTabPath) return;

    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.file.path === activeTabPath
          ? { ...tab, wordCount: newWordCount, isDirty: newIsDirty }
          : tab
      )
    );
  };

  // Handle citation opening
  const handleOpenCitation = useCallback(async (data: {
    pdfPath: string;
    page: number;
    annotationId?: string;
  }) => {
    try {
      const files = await window.api['file:list']();
      const targetFile = files.find((f) => f.path === data.pdfPath);

      if (targetFile) {
        // Check if file is already open
        const existingTab = tabs.find((t) => t.file.path === targetFile.path);

        if (existingTab) {
          // Update citation target and switch to tab
          setTabs((prevTabs) =>
            prevTabs.map((tab) =>
              tab.file.path === targetFile.path
                ? {
                    ...tab,
                    citationTarget: {
                      page: data.page,
                      annotationId: data.annotationId,
                    },
                  }
                : tab
            )
          );
          setActiveTabPath(targetFile.path);
        } else {
          // Open new tab with citation target
          const newTab: Tab = {
            file: targetFile,
            isDirty: false,
            wordCount: 0,
            citationTarget: {
              page: data.page,
              annotationId: data.annotationId,
            },
          };

          setTabs([...tabs, newTab]);
          setActiveTabPath(targetFile.path);
        }
      }
    } catch (error) {
      console.error('Error handling citation:', error);
    }
  }, [tabs]);

  // Listen for open-citation IPC events
  useEffect(() => {
    window.events.on('open-citation', handleOpenCitation);
    return () => {
      window.events.off('open-citation', handleOpenCitation);
    };
  }, [handleOpenCitation]);

  // Listen for custom citation events
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        pdfPath: string;
        page: number;
        annotationId?: string;
      }>;
      handleOpenCitation(customEvent.detail);
    };

    window.addEventListener('open-citation', handler);
    return () => {
      window.removeEventListener('open-citation', handler);
    };
  }, [handleOpenCitation]);

  // Listen for custom events (settings, export, etc.)
  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true);
    const handleExportHTML = async () => {
      if (activeTab?.file.type === 'markdown') {
        try {
          await window.api['export:markdown-to-html'](activeTab.file.path);
          alert('Exported to HTML successfully!');
        } catch (error) {
          console.error('Export failed:', error);
          alert('Export failed. See console for details.');
        }
      }
    };
    const handleExportPDF = async () => {
      if (activeTab?.file.type === 'markdown') {
        try {
          await window.api['export:markdown-to-pdf'](activeTab.file.path);
          alert('Exported to PDF successfully!');
        } catch (error) {
          console.error('Export failed:', error);
          alert('Export failed. See console for details.');
        }
      }
    };

    window.addEventListener('open-settings', handleOpenSettings);
    window.addEventListener('export-html', handleExportHTML);
    window.addEventListener('export-pdf', handleExportPDF);

    return () => {
      window.removeEventListener('open-settings', handleOpenSettings);
      window.removeEventListener('export-html', handleExportHTML);
      window.removeEventListener('export-pdf', handleExportPDF);
    };
  }, [activeTab]);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.COMMAND_PALETTE,
      action: () => setCommandPaletteOpen(true),
    },
    {
      ...SHORTCUTS.SEARCH,
      action: () => setGlobalSearchOpen(true),
    },
    {
      ...SHORTCUTS.SETTINGS,
      action: () => setSettingsOpen(true),
    },
    {
      ...SHORTCUTS.CLOSE_TAB,
      action: () => {
        if (activeTabPath) {
          handleTabClose(activeTabPath);
        }
      },
    },
    {
      ...SHORTCUTS.NEXT_TAB,
      action: () => {
        if (tabs.length > 0 && activeTabPath) {
          const currentIndex = tabs.findIndex((t) => t.file.path === activeTabPath);
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTabPath(tabs[nextIndex].file.path);
        }
      },
    },
    {
      ...SHORTCUTS.PREV_TAB,
      action: () => {
        if (tabs.length > 0 && activeTabPath) {
          const currentIndex = tabs.findIndex((t) => t.file.path === activeTabPath);
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          setActiveTabPath(tabs[prevIndex].file.path);
        }
      },
    },
  ]);

  return (
    <div className="h-screen w-screen flex flex-col bg-vscode-bg overflow-hidden">
      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTab={activeTabPath}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-64 border-r border-vscode-border flex-shrink-0 flex flex-col">
            <RecentFiles onFileSelect={handleFileSelect} />
            <div className="flex-1 overflow-hidden">
              <FileExplorer
                onFileSelect={handleFileSelect}
                selectedPath={activeTab?.file.path}
              />
            </div>
          </div>
        )}

        {/* Editor pane */}
        <div className="flex-1">
          <EditorPane
            file={activeTab?.file || null}
            onEditorStateChange={handleEditorStateChange}
            citationTarget={activeTab?.citationTarget || null}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        currentFile={activeTab?.file.path}
        wordCount={activeTab?.wordCount || 0}
        isDirty={activeTab?.isDirty || false}
      />

      {/* Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onFileSelect={handleFileSelect}
      />

      <GlobalSearch
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onFileSelect={handleFileSelect}
      />

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};
