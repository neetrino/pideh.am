import { describe, expect, it } from 'vitest';

import { blogHtmlToPlainText, plainTextToBlogHtml } from '@/features/blog/domain/blog-content';

describe('blog content', () => {
  it('converts stored HTML to editable plain text', () => {
    expect(blogHtmlToPlainText('<p>White Shop is ready.</p>')).toBe('White Shop is ready.');
    expect(blogHtmlToPlainText('<p>One<br>Two</p><p>Tom &amp; Jerry</p>')).toBe(
      'One\nTwo\n\nTom & Jerry',
    );
    expect(blogHtmlToPlainText('<ul><li>A</li><li><strong>B</strong></li></ul>')).toBe('A\n\nB');
  });

  it('converts plain text to paragraphs with line breaks', () => {
    expect(plainTextToBlogHtml('One\nTwo\n\n\nThree')).toBe('<p>One<br>Two</p><p>Three</p>');
  });

  it('escapes markup typed as text', () => {
    expect(plainTextToBlogHtml('<script>x</script> & "q"')).toBe(
      '<p>&lt;script&gt;x&lt;/script&gt; &amp; &quot;q&quot;</p>',
    );
  });

  it('round-trips plain text', () => {
    const text = 'Line 1\nLine 2\n\nTom & <Jerry>';
    expect(blogHtmlToPlainText(plainTextToBlogHtml(text))).toBe(text);
  });
});
