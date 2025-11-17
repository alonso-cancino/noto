/**
 * Tests for DriveSetup component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DriveSetup from '../index';

describe('DriveSetup', () => {
  const mockOnClose = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <DriveSetup
        isOpen={false}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render signin step when open', () => {
    render(
      <DriveSetup
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );
    expect(screen.getByText('Connect to Google Drive')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('should call onClose when skip button clicked', () => {
    render(
      <DriveSetup
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    const skipButton = screen.getByText('Skip for now');
    fireEvent.click(skipButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show loading state when signing in', async () => {
    render(
      <DriveSetup
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    const signInButton = screen.getByText('Sign in with Google');
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });

  // Note: Full setup flow testing requires integration with Drive API
  // These are basic UI tests
});
