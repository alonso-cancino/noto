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
    if (!filePath || !isDirty) {
      return;
    }

    try {
      await window.api['file:write'](filePath, content);
      setSavedContent(content);
      setIsDirty(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save file';
      setError(errorMessage);
      console.error('Error saving file:', err);
      throw err;
    }
  }, [filePath, content, isDirty]);

  // Set content with dirty tracking
  const setContent = useCallback(
    (newContent: string) => {
      setContentState(newContent);
      setIsDirty(newContent !== savedContent);

      // Auto-save after delay
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (newContent !== savedContent && filePath) {
          save();
        }
      }, autoSaveDelay);
    },
    [savedContent, filePath, save, autoSaveDelay]
  );

  // Load content when file path changes
  useEffect(() => {
    // Save previous file before switching
    if (currentFilePathRef.current && currentFilePathRef.current !== filePath && isDirty) {
      save();
    }

    loadContent();
  }, [filePath, loadContent, isDirty, save]);

  // Save before unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Save on unmount if dirty
      if (isDirty && filePath) {
        window.api['file:write'](filePath, content).catch(console.error);
      }
    };
  }, [isDirty, filePath, content]);

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
