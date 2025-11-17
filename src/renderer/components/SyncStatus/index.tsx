/**
 * SyncStatus - Shows sync status in the status bar
 *
 * Displays:
 * - Online/Offline status
 * - Syncing indicator
 * - Last sync time
 * - Sync errors
 */

import React, { useEffect, useState } from 'react';

interface SyncStatusProps {
  className?: string;
}

type SyncState =
  | 'synced'
  | 'syncing'
  | 'offline'
  | 'error'
  | 'uploading'
  | 'downloading'
  | 'conflict';

export const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    // Listen to sync events from main process
    // These would be sent via IPC

    // Check online status
    const updateOnlineStatus = () => {
      setSyncState(navigator.onLine ? 'synced' : 'offline');
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const getIcon = (): string => {
    switch (syncState) {
      case 'synced':
        return '✓';
      case 'syncing':
      case 'uploading':
      case 'downloading':
        return '↻';
      case 'offline':
        return '⚠';
      case 'error':
        return '✕';
      case 'conflict':
        return '⚠';
      default:
        return '•';
    }
  };

  const getColor = (): string => {
    switch (syncState) {
      case 'synced':
        return 'text-green-500';
      case 'syncing':
      case 'uploading':
      case 'downloading':
        return 'text-blue-500';
      case 'offline':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'conflict':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = (): string => {
    switch (syncState) {
      case 'synced':
        return lastSyncTime
          ? `Synced ${getRelativeTime(lastSyncTime)}`
          : 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'uploading':
        return queueSize > 0 ? `Uploading ${queueSize} file(s)...` : 'Uploading...';
      case 'downloading':
        return 'Downloading...';
      case 'offline':
        return 'Offline';
      case 'error':
        return errorMessage || 'Sync error';
      case 'conflict':
        return 'Conflict detected';
      default:
        return 'Unknown';
    }
  };

  const getRelativeTime = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) {
      return 'just now';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const handleClick = () => {
    // TODO: Show sync details dialog or trigger manual sync
    console.log('Sync status clicked');
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 cursor-pointer hover:bg-gray-700 ${className}`}
      onClick={handleClick}
      title={getStatusText()}
    >
      <span className={`${getColor()} ${syncState === 'syncing' || syncState === 'uploading' || syncState === 'downloading' ? 'animate-spin' : ''}`}>
        {getIcon()}
      </span>
      <span className="text-sm text-gray-300">{getStatusText()}</span>
    </div>
  );
};

export default SyncStatus;
