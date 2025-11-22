import React from 'react';

export const MilkdownProvider = ({ children }: any) => (
  <div data-testid="milkdown-provider">{children}</div>
);

export const Milkdown = () => <div data-testid="milkdown-editor">Editor</div>;

export const useEditor = (factory: any) => {
  // Call the factory to test initialization
  const mockRoot = document.createElement('div');
  try {
    factory(mockRoot);
  } catch (error) {
    // Ignore errors from Milkdown initialization in test environment
  }
};
