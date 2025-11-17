import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageNavigation } from '../PageNavigation';

describe('PageNavigation', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('should render current page and total pages', () => {
    render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByText(/of 10/i)).toBeInTheDocument();
  });

  it('should call onPageChange when previous button clicked', () => {
    render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByLabelText('Previous page');
    fireEvent.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('should call onPageChange when next button clicked', () => {
    render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(6);
  });

  it('should disable previous button on first page', () => {
    render(
      <PageNavigation
        currentPage={1}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();

    fireEvent.click(prevButton);
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('should disable next button on last page', () => {
    render(
      <PageNavigation
        currentPage={10}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();

    fireEvent.click(nextButton);
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('should allow jumping to specific page via input', () => {
    render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const input = screen.getByLabelText('Current page number') as HTMLInputElement;

    // Change to page 7
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.blur(input);

    expect(mockOnPageChange).toHaveBeenCalledWith(7);
  });

  it('should handle Enter key in page input', () => {
    render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const input = screen.getByLabelText('Current page number');

    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should reset input on invalid page number', () => {
    render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const input = screen.getByLabelText('Current page number') as HTMLInputElement;

    // Try to set invalid page
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.blur(input);

    expect(mockOnPageChange).not.toHaveBeenCalled();
    expect(input.value).toBe('5'); // Should reset to current page
  });

  it('should reset input on Escape key', () => {
    render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const input = screen.getByLabelText('Current page number') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mockOnPageChange).not.toHaveBeenCalled();
    expect(input.value).toBe('5');
  });

  it('should handle non-numeric input gracefully', () => {
    render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const input = screen.getByLabelText('Current page number') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    expect(mockOnPageChange).not.toHaveBeenCalled();
    expect(input.value).toBe('5');
  });

  it('should update input when currentPage prop changes', () => {
    const { rerender } = render(
      <PageNavigation
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    const input = screen.getByLabelText('Current page number') as HTMLInputElement;
    expect(input.value).toBe('5');

    // Update current page
    rerender(
      <PageNavigation
        currentPage={7}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    expect(input.value).toBe('7');
  });
});
