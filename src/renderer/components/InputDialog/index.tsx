/**
 * InputDialog - Simple modal dialog for text input
 * Used as a replacement for browser's prompt() which is not supported in Electron
 */

import React, { useState, useEffect, useRef } from 'react';

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  title,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value and focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-vscode-bg border border-vscode-border rounded-lg shadow-2xl w-full max-w-md">
        {/* Title */}
        <div className="p-4 border-b border-vscode-border">
          <h2 className="text-vscode-text font-semibold">{title}</h2>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-vscode-input text-vscode-text border border-vscode-border rounded focus:outline-none focus:border-vscode-accent"
          />
        </form>

        {/* Buttons */}
        <div className="p-4 border-t border-vscode-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-vscode-button text-vscode-button-text rounded hover:bg-vscode-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-vscode-accent text-white rounded hover:opacity-90 transition-opacity"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
