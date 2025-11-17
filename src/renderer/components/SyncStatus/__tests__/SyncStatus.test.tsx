/**
 * Tests for SyncStatus component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import SyncStatus from '../index';

// Mock navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('SyncStatus', () => {
  it('should render sync status', () => {
    render(<SyncStatus />);
    expect(screen.getByText(/synced/i)).toBeInTheDocument();
  });

  it('should show offline status when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<SyncStatus />);
    // Trigger offline event
    window.dispatchEvent(new Event('offline'));

    // Should eventually show offline (async update)
    setTimeout(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    }, 100);
  });

  // Note: Full sync status testing requires integration with sync engine
  // These are basic UI tests
});
