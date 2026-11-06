import { EditorContent, useEditor } from '@tiptap/react';
import type { RichTextDoc } from '../types';
import { richTextExtensions } from './richTextExtensions';

/** Read-only rendering through the same editor schema — no innerHTML. Remount (key) to change content. */
export function RichTextView({ value }: { value: RichTextDoc }) {
  const editor = useEditor({
    extensions: richTextExtensions(),
    content: value,
    editable: false,
    editorProps: { attributes: { class: 'app-prose max-w-none outline-none' } },
  });
  return <EditorContent editor={editor} />;
}
