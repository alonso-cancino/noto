# Noto

![CI](https://github.com/yourusername/noto/workflows/CI/badge.svg)

A desktop research and note-taking application for academic workflows. Combines markdown editing with PDF annotation, citations, and cloud sync. Built for researchers, students, and anyone working with academic papers and technical documentation.

## Current Status

**Version:** 0.2.0-alpha (Early Development)
**Status:** Phases 1-2 Complete

### ✅ What Works Now
- **Markdown Editor** - Full markdown support with live preview (Monaco Editor)
- **LaTeX Math** - Beautiful math rendering with KaTeX (`$inline$` and `$$block$$` equations)
- **Local File Storage** - Create, edit, and organize markdown files locally
- **Auto-Save** - Automatic saving with dirty state tracking
- **Code Highlighting** - Syntax highlighting in code blocks

### 🚧 In Development (See [PR_ROADMAP.md](PR_ROADMAP.md))
- PDF Viewer & Annotations (Phase 3)
- Citation System (Phase 5)
- Google Drive Sync (Phase 6)
- Search & Command Palette (Phase 7)
- Windows/Mac/Linux Installers (Phase 8)

## Current Features

### Core Functionality (Implemented)

- **Markdown Editor** ✅ - Write notes with full markdown support and live preview
- **LaTeX Math** ✅ - Beautiful math rendering with KaTeX
- **VSCode Editor** ✅ - Monaco Editor with syntax highlighting
- **Local Storage** ✅ - File system for notes and folders
- **Auto-Save** ✅ - Never lose your work

### Planned Features (Coming Soon)

- **PDF Viewer** 🚧 - Read PDF documents (Phase 3)
- **PDF Annotations** 🚧 - Highlight text, add notes (Phase 4)
- **Citation System** 🚧 - Quote PDFs in markdown with bidirectional links (Phase 5)
- **Google Drive Sync** 🚧 - Cloud synchronization (Phase 6)
- **Full-Text Search** 🚧 - Search across all notes (Phase 7)
- **Command Palette** 🚧 - Quick command access (Phase 7)

## Installation

### Development Setup (Current)

**Note:** Noto is in early development. Installers will be available after Phase 8.

#### Prerequisites

- **Node.js:** v18+
- **npm:** v9+
- **Operating System:** Windows 10+, macOS 10.13+, or Linux

#### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/noto.git
cd noto

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The app will launch with hot reload enabled.

#### File Storage

Files are stored locally in:
- **Linux/macOS:** `~/.config/noto/workspace/`
- **Windows:** `%APPDATA%\noto\workspace\`

## Getting Started

### Creating Your First Note

1. **Launch the app** with `npm run dev`

2. **Create a new file**
   - Click the "📄 New File" icon in the sidebar
   - Enter a filename (e.g., `notes.md`)
   - Press Enter

3. **Start writing**
   - The Monaco editor will open
   - Type your markdown
   - Preview updates in real-time
   - Auto-saves after 500ms of inactivity

### Using the App (Current Features)

#### Writing Markdown

```markdown
# My Research Notes

This is a **bold** statement with *italic* emphasis.

## LaTeX Math

Inline math: $E = mc^2$

Block equations:

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

## Code Blocks

```javascript
function hello() {
  console.log('Hello from Noto!');
}
```
```

The preview updates in real-time as you type, showing rendered markdown with syntax highlighting and LaTeX math.

#### Organizing Files

- Create folders by clicking the "📁 New Folder" icon
- Create markdown files with the "📄 New File" icon
- Files are stored locally in your workspace directory
- File tree refreshes when you create new files/folders

### Monaco Editor Features

Since Noto uses Monaco (VSCode's editor), you get these powerful features:
- **Syntax highlighting** for markdown
- **Find & Replace** (Cmd/Ctrl+F)
- **Multi-cursor editing** (Alt+Click)
- **Bracket matching** and auto-completion
- **Line numbers** and code folding
- Professional editing experience

### Coming Soon

**PDF Features** (Phases 3-4):
- PDF viewer with page navigation
- Annotations (highlights, notes, area selections)
- PDF-to-markdown citations with bidirectional links

**Sync Features** (Phase 6):
- Google Drive synchronization
- Offline support with automatic sync
- Conflict resolution

**Search & Polish** (Phase 7):
- Full-text search across all notes and PDFs
- Command palette (Cmd/Ctrl+P)
- Multiple tabs for simultaneous editing
- Customizable keyboard shortcuts
- Dark/Light theme toggle

## Features in Detail

### Markdown Support

Noto supports full GitHub-flavored markdown:

- **Headers:** `# H1`, `## H2`, etc.
- **Emphasis:** `*italic*`, `**bold**`, `***bold italic***`
- **Lists:** Ordered and unordered
- **Links:** `[text](url)`
- **Images:** `![alt](url)`
- **Code blocks:** With syntax highlighting
- **Tables:** Full table support
- **Task lists:** `- [ ] Task`

### LaTeX Math

Write beautiful equations:

**Inline:** `$E = mc^2$` → $E = mc^2$

**Block:**
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

Supports all standard LaTeX math commands via KaTeX.

### PDF Annotations

**Highlight Types:**
- **Yellow** - Important content
- **Green** - Definitions
- **Blue** - Questions/unclear
- **Red** - Critical/errors
- **Purple** - Custom

**Annotation Actions:**
- Add text notes to any highlight
- Create standalone sticky notes
- Select rectangular areas
- Edit or delete existing annotations
- Filter annotations by type/color

**Annotations Sidebar:**
- View all annotations for current PDF
- Click to jump to location
- Filter by type or color
- Export annotations

### Synchronization

**How it works:**
- All files are stored in a designated Google Drive folder
- Changes are automatically uploaded in the background
- Other devices download changes periodically (every 30 seconds)
- Works offline - changes sync when reconnected
- Conflict resolution if the same file is edited on multiple devices

**Sync Status Indicators:**
- ✓ **Synced** - All changes uploaded
- ↑ **Uploading** - Changes being uploaded
- ↓ **Downloading** - Updates being downloaded
- ⚠ **Conflict** - Manual resolution needed
- ✗ **Offline** - No internet connection

### Search

**Quick Search** (Cmd/Ctrl+P):
- Fuzzy file name matching
- Jump to any file instantly

**Full-Text Search** (Cmd/Ctrl+Shift+F):
- Search across all markdown files
- Search within PDF text
- Search annotation notes
- Results grouped by file
- Click to jump to match

## Settings

Access settings via **File → Preferences** or `Cmd/Ctrl + ,`

### Available Settings

- **Google Drive Folder** - Change the sync folder location
- **Auto-Save Interval** - How often to save (default: 500ms after typing stops)
- **Default Highlight Color** - Default annotation color
- **Theme** - Dark or light mode
- **Font Size** - Editor font size (10-24pt)
- **Font Family** - Editor font (monospace fonts)
- **Sync Interval** - How often to check for remote changes (default: 30s)
- **Show Line Numbers** - Display line numbers in editor
- **Word Wrap** - Wrap long lines

## Troubleshooting

### Cannot Sign In with Google

**Problem:** OAuth screen doesn't appear or fails

**Solution:**
1. Check your internet connection
2. Ensure you're not behind a restrictive firewall
3. Try signing out and back in
4. Check the [Google Drive API status](https://status.cloud.google.com/)

### Files Not Syncing

**Problem:** Changes not appearing on other devices

**Solution:**
1. Check sync status in status bar (bottom)
2. Ensure you're signed in (Settings → Account)
3. Verify internet connection
4. Check Google Drive storage quota (may be full)
5. Look for conflict warnings

### PDF Won't Open

**Problem:** PDF file doesn't load

**Solution:**
1. Verify the PDF is not corrupted (open in another app)
2. Check file size (very large PDFs may be slow)
3. Try re-importing the PDF
4. Check browser console for errors (View → Toggle Developer Tools)

### Annotations Disappeared

**Problem:** Highlights or notes missing from PDF

**Solution:**
1. Check if the `.pdf.annotations.json` file exists (might be hidden)
2. Look in Google Drive trash (may have been accidentally deleted)
3. Check file sync status
4. Restore from Google Drive version history if needed

### Performance Issues

**Problem:** App is slow or laggy

**Solution:**
1. Close unused tabs (View → Close Other Tabs)
2. Reduce sync interval (Settings → Sync Interval)
3. Clear local cache (Settings → Advanced → Clear Cache)
4. Check available disk space
5. Restart the application

## Privacy & Security

### Data Storage

- **Local:** Files cached in encrypted format on your device
- **Cloud:** Files stored in your personal Google Drive
- **Access:** Only you and applications you authorize can access your data

### Authentication

- OAuth 2.0 for secure Google authentication
- Tokens stored encrypted using OS keychain
- No passwords stored in the app
- Can revoke access anytime via Google Account settings

### Network

- All communication with Google Drive uses HTTPS
- No data sent to third-party servers
- No telemetry or analytics (unless you opt in)

## Development

Want to contribute or build from source? See [CONTRIBUTING.md](CONTRIBUTING.md)

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/noto.git
cd noto

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Create installers
npm run make
```

### Tech Stack

- **Electron** - Desktop framework
- **React** - UI library
- **TypeScript** - Type safety
- **Monaco Editor** - Code editor
- **PDF.js** - PDF rendering
- **markdown-it** - Markdown parsing
- **KaTeX** - LaTeX rendering
- **Tailwind CSS** - Styling
- **Google Drive API** - Cloud storage

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

## Development Roadmap

See **[PR_ROADMAP.md](PR_ROADMAP.md)** for the complete 52-PR development plan.

### Current Progress

- ✅ **Phase 1:** Foundation & File System (Complete)
- ✅ **Phase 2:** Markdown Editor with Monaco (Complete)
- 🚧 **Phase 3:** PDF Viewer (7 PRs) - Next
- 🚧 **Phase 4:** PDF Annotations (8 PRs)
- 🚧 **Phase 5:** Citation System (5 PRs)
- 🚧 **Phase 6:** Google Drive Sync (10 PRs)
- 🚧 **Phase 7:** Search & Polish (10 PRs)
- 🚧 **Phase 8:** Build & Distribution (7 PRs)

### Upcoming Milestones

**v0.3.0** (Phase 3 Complete)
- PDF viewing with navigation and zoom
- Text selection in PDFs
- In-PDF search

**v0.5.0** (Phase 4 Complete)
- PDF annotations (highlights, notes, areas)
- Annotation management

**v0.7.0** (Phase 5 Complete)
- Citation system with noto:// protocol
- Quote PDFs in markdown notes
- Bidirectional links

**v1.0.0** (All Phases Complete)
- Google Drive sync
- Full-text search
- Windows/Mac/Linux installers
- Auto-updates

### Future (v2.0+)

- Real-time collaboration
- Graph view of linked notes
- Zotero integration
- Reference manager (BibTeX)
- Mobile companion app
- Plugin system

## FAQ

**Q: Is Noto free?**
A: Yes, Noto is free and open source (MIT License).

**Q: What's the current status?**
A: Noto is in early development (v0.2-alpha). Markdown editing works well. PDF features and Google Drive sync are coming soon.

**Q: Can I use it now?**
A: Yes! It's a great local markdown editor with LaTeX support. PDF and sync features are in development.

**Q: Where are my files stored?**
A: Currently files are stored locally in `~/.config/noto/workspace/` (Linux/macOS) or `%APPDATA%\noto\workspace\` (Windows). Google Drive sync will be added in Phase 6.

**Q: When will Windows installers be available?**
A: Phase 8 includes building Windows (.exe), macOS (.dmg), and Linux (AppImage/deb) installers. Estimated completion: 12-16 weeks from now.

**Q: Can I contribute?**
A: Yes! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. The project uses a PR-based development workflow designed for parallel contribution.

**Q: How can I help speed up development?**
A: The roadmap is designed for multiple contributors working in parallel. See [PR_ROADMAP.md](PR_ROADMAP.md) to pick up a PR.

**Q: Will my data be private?**
A: Yes. When Google Drive sync is implemented (Phase 6), your data will be stored in your personal Google Drive. Noto has no backend servers and doesn't collect any data.

## Support

- **Documentation:** [docs.noto.app](https://docs.noto.app) (coming soon)
- **Issues:** [GitHub Issues](https://github.com/yourusername/noto/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/noto/discussions)
- **Email:** support@noto.app

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with amazing open source projects:

- [Electron](https://www.electronjs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VSCode)
- [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla)
- [KaTeX](https://katex.org/)
- [React](https://react.dev/)

---

Made with ❤️ for researchers and knowledge workers.

**[Download Now](https://github.com/yourusername/noto/releases)** | **[Documentation](ARCHITECTURE.md)** | **[Contributing](CONTRIBUTING.md)**
