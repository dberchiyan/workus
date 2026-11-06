import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';

/**
 * Exactly what the server accepts: paragraphs, hard breaks, bullet/ordered lists, bold, italic.
 * Everything else in StarterKit is switched off (no links, headings, code, quotes, rules).
 */
export const richTextExtensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    link: false,
    underline: false,
  }),
  ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
];
