/**
 * UpdateNotification Component
 *
 * Displays update notifications and handles update flow
 */

import React, { useState, useEffect } from 'react';
import type { UpdateInfo, DownloadProgress } from '../../../shared/types';

interface UpdateNotificationProps {
  className?: string;
}

type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'not-available';

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ className = '' }) => {
  const [state, setState] = useState<UpdateState>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if auto-updates are supported on this platform
    window.api['updater:is-supported']().then(setIsSupported);

    if (!isSupported) {
      return;
    }

    // Set up event listeners
    const handleCheckingForUpdate = () => {
      setState('checking');
      setVisible(true);
    };

    const handleUpdateAvailable = (info: UpdateInfo) => {
      setState('available');
      setUpdateInfo(info);
      setVisible(true);
    };

    const handleUpdateNotAvailable = () => {
      setState('not-available');
      // Auto-hide after 3 seconds if user manually checked
      setTimeout(() => setVisible(false), 3000);
    };

    const handleDownloadProgress = (progressObj: DownloadProgress) => {
      setState('downloading');
      setProgress(progressObj);
      setVisible(true);
    };

    const handleUpdateDownloaded = (info: UpdateInfo) => {
      setState('downloaded');
      setUpdateInfo(info);
      setProgress(null);
      setVisible(true);
    };

    const handleUpdateError = (err: { message: string; error: string }) => {
      setState('error');
      setError(err.message || err.error);
      setVisible(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setVisible(false), 5000);
    };

    window.events.on('updater:checking-for-update', handleCheckingForUpdate);
    window.events.on('updater:update-available', handleUpdateAvailable);
    window.events.on('updater:update-not-available', handleUpdateNotAvailable);
    window.events.on('updater:download-progress', handleDownloadProgress);
    window.events.on('updater:update-downloaded', handleUpdateDownloaded);
    window.events.on('updater:update-error', handleUpdateError);

    return () => {
      window.events.off('updater:checking-for-update', handleCheckingForUpdate);
      window.events.off('updater:update-available', handleUpdateAvailable);
      window.events.off('updater:update-not-available', handleUpdateNotAvailable);
      window.events.off('updater:download-progress', handleDownloadProgress);
      window.events.off('updater:update-downloaded', handleUpdateDownloaded);
      window.events.off('updater:update-error', handleUpdateError);
    };
  }, [isSupported]);

  const handleCheckForUpdates = async () => {
    try {
      await window.api['updater:check-for-updates']();
    } catch (err) {
      console.error('Failed to check for updates:', err);
    }
  };

  const handleDownload = async () => {
    try {
      await window.api['updater:download-update']();
    } catch (err) {
      console.error('Failed to download update:', err);
    }
  };

  const handleInstall = async () => {
    try {
      await window.api['updater:quit-and-install']();
    } catch (err) {
      console.error('Failed to install update:', err);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!isSupported || !visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl
                  max-w-md p-4 animate-slide-up z-50 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <h3 className="font-semibold text-white">
            {state === 'checking' && 'Checking for updates...'}
            {state === 'available' && 'Update available'}
            {state === 'downloading' && 'Downloading update...'}
            {state === 'downloaded' && 'Update ready'}
            {state === 'not-available' && 'You\'re up to date'}
            {state === 'error' && 'Update error'}
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="text-gray-300 text-sm mb-3">
        {state === 'checking' && <p>Checking for new versions...</p>}

        {state === 'available' && updateInfo && (
          <div>
            <p className="mb-1">Version {updateInfo.version} is available.</p>
            {updateInfo.releaseNotes && (
              <p className="text-xs text-gray-400 line-clamp-2">{updateInfo.releaseNotes}</p>
            )}
          </div>
        )}

        {state === 'downloading' && progress && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span>{Math.round(progress.percent)}%</span>
              <span className="text-xs text-gray-400">
                {formatBytes(progress.bytesPerSecond)}/s
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {state === 'downloaded' && updateInfo && (
          <div>
            <p className="mb-1">Version {updateInfo.version} has been downloaded.</p>
            <p className="text-xs text-gray-400">Restart to install the update.</p>
          </div>
        )}

        {state === 'not-available' && (
          <p>You have the latest version of Noto.</p>
        )}

        {state === 'error' && (
          <div>
            <p className="text-red-400">{error}</p>
            <button
              onClick={handleCheckForUpdates}
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {state === 'available' && (
          <>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white
                         rounded transition-colors"
            >
              Download
            </button>
          </>
        )}

        {state === 'downloaded' && (
          <>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white
                         rounded transition-colors"
            >
              Restart & Install
            </button>
          </>
        )}

        {state === 'not-available' && (
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
