import FormatBoldOutlined from '@mui/icons-material/FormatBoldOutlined';
import FormatItalicOutlined from '@mui/icons-material/FormatItalicOutlined';
import FormatListBulletedOutlined from '@mui/icons-material/FormatListBulletedOutlined';
import FormatListNumberedOutlined from '@mui/icons-material/FormatListNumberedOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { FEEDBACK_MAX_TEXT, isRichTextDoc, richTextLength } from '../richText';
import type { RichTextDoc } from '../types';
import { richTextExtensions } from './richTextExtensions';

export interface RichTextEditorProps {
  label: string;
  value: RichTextDoc | null;
  onChange: (value: RichTextDoc | null) => void;
  placeholder: string;
  /** Error text (localised); shown under the editor instead of the counter. */
  error?: string | undefined;
}

/** TipTap editor with a small toolbar; the value is the document JSON, never HTML. */
export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  error,
}: RichTextEditorProps) {
  const { t, i18n } = useTranslation('review');
  const helperId = useId();
  const editor = useEditor({
    extensions: richTextExtensions(placeholder),
    content: value,
    onUpdate: ({ editor: current }) => {
      const json: unknown = current.getJSON();
      onChange(current.isEmpty || !isRichTextDoc(json) ? null : json);
    },
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
        'aria-describedby': helperId,
        ...(error ? { 'aria-invalid': 'true' } : {}),
        class: 'app-prose min-h-48 max-w-none px-3 py-2 outline-none',
      },
    },
  });
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      length: richTextLength(current.getJSON()),
    }),
  });

  const tools = [
    {
      key: 'bold',
      label: t('editor.bold'),
      icon: <FormatBoldOutlined fontSize="small" />,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: t('editor.italic'),
      icon: <FormatItalicOutlined fontSize="small" />,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'bulletList',
      label: t('editor.bulletList'),
      icon: <FormatListBulletedOutlined fontSize="small" />,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'orderedList',
      label: t('editor.orderedList'),
      icon: <FormatListNumberedOutlined fontSize="small" />,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ] as const;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'flex flex-col rounded-sm border border-divider focus-within:border-primary',
          error && 'border-error focus-within:border-error',
        )}
      >
        <div
          role="toolbar"
          aria-label={t('editor.toolbar', { label })}
          className="flex gap-1 border-b border-divider px-1 py-1"
        >
          {tools.map((tool) => (
            <Tooltip key={tool.key} title={tool.label}>
              <IconButton
                size="small"
                aria-label={tool.label}
                aria-pressed={state[tool.key]}
                // Keeps the caret and selection in the editor; keyboard activation refocuses it in run().
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  tool.run();
                }}
                className={cn(
                  'min-h-9 min-w-9',
                  state[tool.key] && 'bg-badge-active-background text-badge-active-text',
                )}
              >
                {tool.icon}
              </IconButton>
            </Tooltip>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
      <Typography
        id={helperId}
        variant="caption"
        color={error ? 'error' : 'textSecondary'}
        className="app-tabular px-3"
      >
        {error ??
          t('editor.count', {
            count: state.length,
            max: new Intl.NumberFormat(i18n.language).format(FEEDBACK_MAX_TEXT),
          })}
      </Typography>
    </div>
  );
}
