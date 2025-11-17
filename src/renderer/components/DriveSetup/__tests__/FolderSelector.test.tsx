/**
 * Tests for FolderSelector component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FolderSelector from '../FolderSelector';

describe('FolderSelector', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectFolder = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <FolderSelector
        isOpen={false}
        onClose={mockOnClose}
        onSelectFolder={mockOnSelectFolder}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when open', () => {
    render(
      <FolderSelector
        isOpen={true}
        onClose={mockOnClose}
        onSelectFolder={mockOnSelectFolder}
      />
    );
    expect(screen.getByText('Select Workspace Folder')).toBeInTheDocument();
  });

  it('should call onClose when cancel button clicked', () => {
    render(
      <FolderSelector
        isOpen={true}
        onClose={mockOnClose}
        onSelectFolder={mockOnSelectFolder}
      />
    );

    const cancelButton = screen.getAllByText('Cancel')[0];
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable select button when no folder selected', () => {
    render(
      <FolderSelector
        isOpen={true}
        onClose={mockOnClose}
        onSelectFolder={mockOnSelectFolder}
      />
    );

    const selectButton = screen.getByText('Select Folder');
    expect(selectButton).toBeDisabled();
  });

  // Note: Full folder selection testing requires integration with Drive API
  // These are basic UI tests
});
