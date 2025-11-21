/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VSCode-inspired dark theme colors
        'vscode-bg': '#1e1e1e',
        'vscode-sidebar': '#252526',
        'vscode-editor': '#1e1e1e',
        'vscode-panel': '#252526',
        'vscode-input': '#3c3c3c',
        'vscode-border': '#3e3e42',
        'vscode-selection': '#264f78',
        'vscode-hover': '#2a2d2e',
        'vscode-button': '#0e639c',
        'vscode-button-text': '#ffffff',
        'vscode-text': '#cccccc',
        'vscode-text-secondary': '#858585',
        'vscode-accent': '#007acc',
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
