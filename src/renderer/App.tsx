import React from 'react';
import { Layout } from './components/Layout';
import { UpdateNotification } from './components/UpdateNotification';

function App() {
  // Check if running in Electron context
  if (typeof window.api === 'undefined') {
    return (
      <div className="h-screen w-screen bg-vscode-bg flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Not Running in Electron
          </h1>
          <p className="text-vscode-text mb-4">
            You're accessing Noto through a web browser. Noto is an Electron desktop application
            and must be run through the Electron window.
          </p>
          <p className="text-vscode-text-secondary text-sm">
            To run Noto correctly, use: <code className="bg-vscode-input px-2 py-1 rounded">npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout />
      <UpdateNotification />
    </>
  );
}

export default App;
