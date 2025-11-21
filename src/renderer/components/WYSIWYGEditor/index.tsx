/**
 * WYSIWYG Markdown Editor using Milkdown
 *
 * Features:
 * - Inline markdown rendering (Obsidian-style)
 * - LaTeX math support
 * - Dark theme
 * - Auto-save integration
 */

import React, { useEffect, useRef } from 'react';
import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { math } from '@milkdown/plugin-math';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import 'katex/dist/katex.min.css';
import './theme.css';

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

const MilkdownEditor: React.FC<WYSIWYGEditorProps> = ({ value, onChange, loading }) => {
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEditor((root) => {
    const editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, value);

        // Configure editor view
        ctx.set(editorViewOptionsCtx, { editable: () => !loading });
      })
      .config(nord)
      .use(commonmark)
      .use(listener)
      .use(history)
      .use(math)
      .config((ctx) => {
        // Set up change listener with stable ref (after plugins are loaded)
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
          onChangeRef.current(markdown);
        });
      });

    editorRef.current = editor;

    return editor;
  }, [value, loading]);

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.action((ctx) => {
      return ctx.get(defaultValueCtx);
    })) {
      editorRef.current.action((ctx) => {
        ctx.set(defaultValueCtx, value);
      });
    }
  }, [value]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-vscode-bg">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-vscode-text">Loading file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-vscode-bg">
      <Milkdown />
    </div>
  );
};

export const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = (props) => {
  return (
    <MilkdownProvider>
      <MilkdownEditor {...props} />
    </MilkdownProvider>
  );
};

export default WYSIWYGEditor;
