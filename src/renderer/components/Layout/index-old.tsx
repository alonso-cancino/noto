import React, { useState, useEffect } from 'react';
import type { FileMetadata } from '../../../shared/types';
import { FileExplorer } from '../FileExplorer';
import { EditorPane } from './EditorPane';
import { StatusBar } from '../StatusBar';

export const Layout: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [sidebarVisible, _setSidebarVisible] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [citationTarget, setCitationTarget] = useState<{
    page: number;
    annotationId?: string;
  } | null>(null);

  const handleFileSelect = (file: FileMetadata) => {
    setSelectedFile(file);
    setWordCount(0);
    setIsDirty(false);
    setCitationTarget(null); // Clear citation target when manually selecting a file
  };

  // Listen for open-citation events from protocol handler (IPC events)
  useEffect(() => {
    const handleOpenCitation = async (data: {
      pdfPath: string;
      page: number;
      annotationId?: string;
    }) => {
      console.log('Received open-citation IPC event:', data);

      try {
        // Get list of files to find the matching PDF
        const files = await window.api['file:list']();
        const targetFile = files.find((f) => f.path === data.pdfPath);

        if (targetFile) {
          // Set the file and citation target
          setSelectedFile(targetFile);
          setCitationTarget({
            page: data.page,
            annotationId: data.annotationId,
          });
        } else {
          console.error('PDF file not found:', data.pdfPath);
        }
      } catch (error) {
        console.error('Error handling open-citation event:', error);
      }
    };

    // Register IPC event listener
    window.events.on('open-citation', handleOpenCitation);

    return () => {
      window.events.off('open-citation', handleOpenCitation);
    };
  }, []);

  // Listen for open-citation custom events from within the app (e.g., markdown preview clicks)
  useEffect(() => {
    const handleCustomCitationEvent = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        pdfPath: string;
        page: number;
        annotationId?: string;
      }>;

      console.log('Received open-citation custom event:', customEvent.detail);

      try {
        // Get list of files to find the matching PDF
        const files = await window.api['file:list']();
        const targetFile = files.find((f) => f.path === customEvent.detail.pdfPath);

        if (targetFile) {
          // Set the file and citation target
          setSelectedFile(targetFile);
          setCitationTarget({
            page: customEvent.detail.page,
            annotationId: customEvent.detail.annotationId,
          });
        } else {
          console.error('PDF file not found:', customEvent.detail.pdfPath);
        }
      } catch (error) {
        console.error('Error handling custom citation event:', error);
      }
    };

    window.addEventListener('open-citation', handleCustomCitationEvent);

    return () => {
      window.removeEventListener('open-citation', handleCustomCitationEvent);
    };
  }, []);

  const handleEditorStateChange = (newWordCount: number, newIsDirty: boolean) => {
    setWordCount(newWordCount);
    setIsDirty(newIsDirty);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-vscode-bg overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-64 border-r border-vscode-border flex-shrink-0">
            <FileExplorer onFileSelect={handleFileSelect} selectedPath={selectedFile?.path} />
          </div>
        )}

        {/* Editor pane */}
        <div className="flex-1">
          <EditorPane
            file={selectedFile}
            onEditorStateChange={handleEditorStateChange}
            citationTarget={citationTarget}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar currentFile={selectedFile?.path} wordCount={wordCount} isDirty={isDirty} />
    </div>
  );
};
