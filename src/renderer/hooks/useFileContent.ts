import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFileContentOptions {
  filePath: string | null;
  autoSaveDelay?: number; // ms to wait before auto-saving
}

interface UseFileContentReturn {
  content: string;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  setContent: (content: string) => void;
  save: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Hook to manage file content loading, editing, and auto-saving
 */
export function useFileContent({
  filePath,
  autoSaveDelay = 500,
}: UseFileContentOptions): UseFileContentReturn {
  const [content, setContentState] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentFilePathRef = useRef<string | null>(null);
  const contentRef = useRef<string>('');
  const filePathRef = useRef<string | null>(null);

  // Update refs when state changes
  contentRef.current = content;
  filePathRef.current = filePath;

  // Load file content
  const loadContent = useCallback(async () => {
    if (!filePath) {
      setContentState('');
      setSavedContent('');
      setIsDirty(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fileContent = await window.api['file:read'](filePath);
      setContentState(fileContent);
      setSavedContent(fileContent);
      setIsDirty(false);
      currentFilePathRef.current = filePath;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      setError(errorMessage);
      console.error('Error loading file:', err);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  // Save file content
  const save = useCallback(async () => {
    const currentPath = filePathRef.current;
    const currentContent = contentRef.current;

    if (!currentPath || currentContent === savedContent) {
      return;
    }

    try {
      await window.api['file:write'](currentPath, currentContent);
      setSavedContent(currentContent);
      setIsDirty(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save file';
      setError(errorMessage);
      console.error('Error saving file:', err);
      throw err;
    }
  }, [savedContent]);

  // Set content with dirty tracking
  const setContent = useCallback(
    (newContent: string) => {
      setContentState(newContent);
      setIsDirty(newContent !== savedContent);

      // Auto-save after delay
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const currentPath = filePathRef.current;
        const currentContent = contentRef.current;

        if (currentPath && currentContent !== savedContent) {
          try {
            await window.api['file:write'](currentPath, currentContent);
            setSavedContent(currentContent);
            setIsDirty(false);
            setError(null);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to auto-save file';
            setError(errorMessage);
            console.error('Error auto-saving file:', err);
          }
        }
      }, autoSaveDelay);
    },
    [savedContent, autoSaveDelay]
  );

  // Load content when file path changes
  useEffect(() => {
    // Save previous file before switching
    if (currentFilePathRef.current && currentFilePathRef.current !== filePath) {
      const previousContent = contentRef.current;
      const previousPath = currentFilePathRef.current;

      if (previousPath && previousContent !== savedContent) {
        window.api['file:write'](previousPath, previousContent).catch(console.error);
      }
    }

    loadContent();
  }, [filePath, loadContent, savedContent]);

  // Save before unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Save on unmount if dirty
      const currentPath = filePathRef.current;
      const currentContent = contentRef.current;

      if (currentPath && currentContent) {
        window.api['file:write'](currentPath, currentContent).catch(console.error);
      }
    };
  }, []);

  return {
    content,
    loading,
    error,
    isDirty,
    setContent,
    save,
    reload: loadContent,
  };
}
