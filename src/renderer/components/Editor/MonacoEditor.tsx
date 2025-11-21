import React, { useRef, useCallback, useEffect } from 'react';
import Editor, { OnChange, OnMount } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

export const MarkdownMonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'markdown',
  readOnly = false,
}) => {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure editor theme to match VSCode dark
    monaco.editor.defineTheme('noto-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#cccccc',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      },
    });

    monaco.editor.setTheme('noto-dark');

    // Enable word wrap
    editor.updateOptions({
      wordWrap: 'on',
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });

    // Focus editor
    editor.focus();
  }, []);

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        onChange(value);
      }
    },
    [onChange]
  );

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={handleChange}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        padding: { top: 16, bottom: 16 },
      }}
    />
  );
};
