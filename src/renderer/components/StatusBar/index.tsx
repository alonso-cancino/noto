import React from 'react';

interface StatusBarProps {
  currentFile?: string;
  wordCount?: number;
  isDirty?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentFile,
  wordCount = 0,
  isDirty = false,
}) => {
  return (
    <div className="h-6 bg-vscode-accent flex items-center justify-between px-3 text-white text-xs">
      <div className="flex items-center gap-4">
        <span>Noto</span>
        {currentFile && (
          <>
            <span className="text-white/60">|</span>
            <span>{currentFile}</span>
            {isDirty && (
              <>
                <span className="text-white/60">|</span>
                <span className="text-yellow-300">● Modified</span>
              </>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {wordCount > 0 && (
          <>
            <span>{wordCount} words</span>
            <span className="text-white/60">|</span>
          </>
        )}
        <span>Local Storage</span>
        <span className="text-white/60">|</span>
        <span>Ready</span>
      </div>
    </div>
  );
};
