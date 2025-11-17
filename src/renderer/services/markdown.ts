import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import hljs from 'highlight.js';

/**
 * Markdown rendering service
 * Configures markdown-it with KaTeX and code highlighting
 */

// Create markdown parser instance
const md = new MarkdownIt({
  html: false, // Disable HTML tags for security
  xhtmlOut: true,
  breaks: true, // Convert \n to <br>
  linkify: true, // Auto-convert URLs to links
  typographer: true, // Smart quotes and other typographic replacements
  highlight: (str, lang) => {
    // Syntax highlighting for code blocks
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        );
      } catch (err) {
        console.error('Highlight error:', err);
      }
    }

    // No language specified, use plain text
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  },
});

// Add KaTeX plugin for LaTeX math
md.use(markdownItKatex, {
  throwOnError: false,
  errorColor: '#cc0000',
});

/**
 * Render markdown to HTML
 */
export function renderMarkdown(content: string): string {
  try {
    return md.render(content);
  } catch (error) {
    console.error('Markdown render error:', error);
    return `<p class="text-red-500">Error rendering markdown: ${error instanceof Error ? error.message : 'Unknown error'}</p>`;
  }
}

/**
 * Render inline markdown (single line, no paragraphs)
 */
export function renderMarkdownInline(content: string): string {
  try {
    return md.renderInline(content);
  } catch (error) {
    console.error('Markdown inline render error:', error);
    return content;
  }
}

/**
 * Extract plain text from markdown (strip formatting)
 */
export function markdownToPlainText(content: string): string {
  // Remove code blocks
  let text = content.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`[^`]+`/g, '');

  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove headers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');

  // Remove LaTeX
  text = text.replace(/\$\$[\s\S]*?\$\$/g, '[equation]');
  text = text.replace(/\$[^$]+\$/g, '[math]');

  return text.trim();
}

/**
 * Count words in markdown content
 */
export function countWords(content: string): number {
  const plainText = markdownToPlainText(content);
  const words = plainText.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(content: string): number {
  const words = countWords(content);
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(words / wordsPerMinute);
}
