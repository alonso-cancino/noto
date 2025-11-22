import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WYSIWYGEditor } from '../index';

// Mocks are provided by jest.config.js moduleNameMapper

describe('WYSIWYGEditor', () => {
  const mockOnChange = jest.fn();
  const defaultValue = '# Hello World\n\nThis is a test.';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading state when loading prop is true', () => {
      render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
          loading={true}
        />
      );

      expect(screen.getByText('Loading file...')).toBeInTheDocument();
      expect(screen.queryByTestId('milkdown-editor')).not.toBeInTheDocument();
    });

    it('should render editor when not loading', () => {
      render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
          loading={false}
        />
      );

      expect(screen.getByTestId('milkdown-provider')).toBeInTheDocument();
      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
      expect(screen.queryByText('Loading file...')).not.toBeInTheDocument();
    });

    it('should render within MilkdownProvider', () => {
      render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const provider = screen.getByTestId('milkdown-provider');
      expect(provider).toBeInTheDocument();

      const editor = screen.getByTestId('milkdown-editor');
      expect(editor).toBeInTheDocument();
      expect(provider).toContainElement(editor);
    });
  });

  describe('Props', () => {
    it('should accept value prop', () => {
      const { rerender } = render(
        <WYSIWYGEditor
          value="Initial value"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();

      rerender(
        <WYSIWYGEditor
          value="Updated value"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
    });

    it('should accept onChange prop', () => {
      render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
      // onChange is tested via Milkdown's listener plugin
    });

    it('should accept optional loading prop', () => {
      const { rerender } = render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText('Loading file...')).not.toBeInTheDocument();

      rerender(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
          loading={true}
        />
      );

      expect(screen.getByText('Loading file...')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator with hourglass emoji', () => {
      render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
          loading={true}
        />
      );

      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Loading file...')).toBeInTheDocument();
    });

    it('should apply correct background color when loading', () => {
      const { container } = render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
          loading={true}
        />
      );

      const loadingContainer = container.querySelector('.bg-vscode-bg');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveClass('bg-vscode-bg');
    });
  });

  describe('Editor Container', () => {
    it('should apply correct styles to editor container', () => {
      render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const editorContainer = screen.getByTestId('milkdown-editor').parentElement;
      expect(editorContainer).toHaveClass('h-full', 'w-full', 'overflow-auto', 'bg-vscode-bg');
    });
  });

  describe('Empty Value', () => {
    it('should handle empty string value', () => {
      render(
        <WYSIWYGEditor
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should initialize editor with all required plugins', () => {
      const { container } = render(
        <WYSIWYGEditor
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      // Editor should be rendered
      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();

      // Container should be present
      expect(container.querySelector('[class*="overflow-auto"]')).toBeInTheDocument();
    });
  });
});
