import type { RichTextDoc } from './types';

/** Mirrors the server limit: characters of text in the document. */
export const FEEDBACK_MAX_TEXT = 2000;

export const richTextLength = (node: unknown): number => {
  if (typeof node !== 'object' || node === null) {
    return 0;
  }
  const text = 'text' in node && typeof node.text === 'string' ? node.text.length : 0;
  const children = 'content' in node && Array.isArray(node.content) ? node.content : [];
  return text + children.reduce((sum: number, child: unknown) => sum + richTextLength(child), 0);
};

/** The editor only produces documents of our whitelisted shape; the server re-validates. */
export const isRichTextDoc = (value: unknown): value is RichTextDoc =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  value.type === 'doc' &&
  'content' in value &&
  Array.isArray(value.content);
