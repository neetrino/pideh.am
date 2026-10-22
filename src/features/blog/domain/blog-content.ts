const BLOCK_CLOSE_REGEX = /<\/(p|h2|h3|li|blockquote|ul|ol)\s*>/gi;
const BR_REGEX = /<br\s*\/?>/gi;
const TAG_REGEX = /<[^>]*>/g;
const PARAGRAPH_SPLIT_REGEX = /\n\s*\n/;

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&amp;': '&',
};

function decodeEntities(text: string): string {
  return text.replace(/&(nbsp|lt|gt|quot|#39|amp);/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Turns stored blog HTML into editable plain text (paragraphs → blank lines). */
export function blogHtmlToPlainText(html: string): string {
  const text = html
    .replace(/\r\n?/g, '\n')
    .replace(BR_REGEX, '\n')
    .replace(BLOCK_CLOSE_REGEX, '\n\n')
    .replace(TAG_REGEX, '');

  return decodeEntities(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Escapes plain text and wraps blank-line separated blocks in paragraphs. */
export function plainTextToBlogHtml(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split(PARAGRAPH_SPLIT_REGEX)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
