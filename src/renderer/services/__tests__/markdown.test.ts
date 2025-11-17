import {
  renderMarkdown,
  renderMarkdownInline,
  markdownToPlainText,
  countWords,
  estimateReadingTime,
} from '../markdown';

describe('markdown service', () => {
  describe('renderMarkdown', () => {
    it('should render heading markdown to HTML', () => {
      const result = renderMarkdown('# Hello World');
      expect(result).toContain('<h1');
      expect(result).toContain('Hello World');
      expect(result).toContain('</h1>');
    });

    it('should render bold text', () => {
      const result = renderMarkdown('**bold text**');
      expect(result).toContain('<strong>bold text</strong>');
    });

    it('should render italic text', () => {
      const result = renderMarkdown('*italic text*');
      expect(result).toContain('<em>italic text</em>');
    });

    it('should render links', () => {
      const result = renderMarkdown('[Example](https://example.com)');
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('Example</a>');
    });

    it('should auto-linkify URLs', () => {
      const result = renderMarkdown('Visit https://example.com');
      expect(result).toContain('<a href="https://example.com"');
    });

    it('should handle line breaks', () => {
      const result = renderMarkdown('Line 1\nLine 2');
      expect(result).toContain('<br');
    });

    it('should handle errors gracefully', () => {
      // Test with empty object to trigger error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = renderMarkdown({} as any);
      expect(result).toContain('Error rendering markdown');
    });
  });

  describe('renderMarkdownInline', () => {
    it('should render inline markdown without paragraph tags', () => {
      const result = renderMarkdownInline('**bold** and *italic*');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).not.toContain('<p>');
    });
  });

  describe('markdownToPlainText', () => {
    it('should strip markdown formatting', () => {
      const result = markdownToPlainText('# Heading\n\n**Bold** and *italic*');
      expect(result).toBe('Heading\n\nBold and italic');
    });

    it('should remove code blocks', () => {
      const result = markdownToPlainText('Text\n```js\ncode\n```\nMore text');
      expect(result).not.toContain('```');
      expect(result).toContain('Text');
      expect(result).toContain('More text');
    });

    it('should remove inline code', () => {
      const result = markdownToPlainText('Use `const` for variables');
      expect(result).not.toContain('`');
    });

    it('should convert links to text', () => {
      const result = markdownToPlainText('[Example](https://example.com)');
      expect(result).toBe('Example');
    });

    it('should convert images to alt text', () => {
      const result = markdownToPlainText('![Alt text](/image.png)');
      expect(result).toBe('Alt text');
    });

    it('should replace LaTeX with placeholders', () => {
      const result = markdownToPlainText('Inline $x^2$ and block $$E=mc^2$$');
      expect(result).toContain('[math]');
      expect(result).toContain('[equation]');
      expect(result).not.toContain('$');
    });

    it('should remove blockquotes', () => {
      const result = markdownToPlainText('> Quote text');
      expect(result).toBe('Quote text');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      const count = countWords('Hello world test');
      expect(count).toBe(3);
    });

    it('should count words in markdown content', () => {
      const count = countWords('# Heading\n\nThis is **bold** text.');
      expect(count).toBe(5); // Heading, This, is, bold, text
    });

    it('should handle empty string', () => {
      const count = countWords('');
      expect(count).toBe(0);
    });

    it('should handle multiple spaces', () => {
      const count = countWords('word1    word2   word3');
      expect(count).toBe(3);
    });

    it('should ignore code blocks in word count', () => {
      const count = countWords('Text\n```\ncode here\n```\nMore text');
      expect(count).toBe(3); // Text, More, text
    });
  });

  describe('estimateReadingTime', () => {
    it('should estimate reading time correctly', () => {
      // 200 words = 1 minute
      const content = Array(200).fill('word').join(' ');
      const time = estimateReadingTime(content);
      expect(time).toBe(1);
    });

    it('should round up reading time', () => {
      // 250 words = 1.25 minutes, should round to 2
      const content = Array(250).fill('word').join(' ');
      const time = estimateReadingTime(content);
      expect(time).toBe(2);
    });

    it('should handle short content', () => {
      const time = estimateReadingTime('Just a few words');
      expect(time).toBe(1); // Minimum 1 minute
    });

    it('should handle empty content', () => {
      const time = estimateReadingTime('');
      expect(time).toBe(0);
    });
  });
});
