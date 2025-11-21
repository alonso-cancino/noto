/**
 * DriveSetup - Google Drive setup wizard
 *
 * Steps:
 * 1. Sign in with Google
 * 2. Select workspace folder
 * 3. Initial sync
 */

import React, { useState } from 'react';
import FolderSelector from './FolderSelector';

interface DriveSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (folderId: string) => void;
}

type SetupStep = 'signin' | 'select-folder' | 'syncing' | 'complete';

export const DriveSetup: React.FC<DriveSetupProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<SetupStep>('signin');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // Authenticate with Google Drive
      const success = await window.api['drive:auth']();

      if (success) {
        setStep('select-folder');
      } else {
        throw new Error('Authentication failed or was cancelled');
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFolderSelected = async (folderId: string, _folderPath: string) => {
    setSelectedFolderId(folderId);
    setStep('syncing');

    try {
      // Trigger initial sync with selected folder
      const syncStatus = await window.api['drive:sync']();

      if (syncStatus.status === 'error') {
        throw new Error(syncStatus.error || 'Sync failed');
      }

      // Show progress animation
      for (let i = 0; i <= 100; i += 10) {
        setSyncProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setStep('complete');
      setTimeout(() => {
        onComplete(folderId);
      }, 1000);
    } catch (err) {
      setError((err as Error).message || 'Sync failed');
      setStep('select-folder');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {step === 'signin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Connect to Google Drive
            </h2>
            <p className="text-gray-300 mb-6">
              Sign in with your Google account to sync your notes and PDFs
              across devices.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <span className="animate-spin">↻</span>
                  Signing in...
                </>
              ) : (
                <>
                  <span>🔐</span>
                  Sign in with Google
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full mt-3 px-4 py-2 text-gray-400 hover:text-white"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {step === 'select-folder' && (
        <FolderSelector
          isOpen={true}
          onClose={onClose}
          onSelectFolder={handleFolderSelected}
        />
      )}

      {step === 'syncing' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Syncing Files
            </h2>
            <p className="text-gray-300 mb-6">
              Downloading your files from Google Drive...
            </p>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>

            <div className="text-center text-gray-400 text-sm">
              Please wait...
            </div>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Setup Complete!
            </h2>
            <p className="text-gray-300 mb-6">
              Your files are now synced with Google Drive.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default DriveSetup;
