import { z } from 'zod';

/**
 * Rich-text feedback is a TipTap/ProseMirror document, never HTML: only these nodes and marks
 * are accepted, anything else (links, images, attributes, unknown types) is rejected. The client
 * renders it with the editor in read-only mode — no innerHTML anywhere.
 */
export const FEEDBACK_MAX_TEXT = 2000;
const MAX_DEPTH = 6;
const MAX_NODES = 1000;

const MarkSchema = z.strictObject({ type: z.enum(['bold', 'italic']) });

const TextSchema = z.strictObject({
  type: z.literal('text'),
  text: z.string().min(1).max(FEEDBACK_MAX_TEXT),
  marks: z.array(MarkSchema).max(2).optional(),
});
const HardBreakSchema = z.strictObject({ type: z.literal('hardBreak') });
const InlineSchema = z.discriminatedUnion('type', [TextSchema, HardBreakSchema]);

export interface RichBlock {
  type: 'paragraph' | 'bulletList' | 'orderedList' | 'listItem';
  attrs?: { start?: number; type?: string | null } | undefined;
  content?: (RichBlock | z.infer<typeof InlineSchema>)[] | undefined;
}

const ParagraphSchema = z.strictObject({
  type: z.literal('paragraph'),
  content: z.array(InlineSchema).max(MAX_NODES).optional(),
});

const BlockSchema: z.ZodType<RichBlock> = z.lazy(() =>
  z.union([
    ParagraphSchema,
    z.strictObject({
      type: z.literal('bulletList'),
      content: z.array(ListItemSchema).min(1).max(200),
    }),
    z.strictObject({
      type: z.literal('orderedList'),
      attrs: z
        .strictObject({
          start: z.number().int().min(1).max(10_000).optional(),
          type: z.string().max(8).nullable().optional(),
        })
        .optional(),
      content: z.array(ListItemSchema).min(1).max(200),
    }),
  ]),
);

const ListItemSchema: z.ZodType<RichBlock> = z.lazy(() =>
  z.strictObject({ type: z.literal('listItem'), content: z.array(BlockSchema).min(1).max(50) }),
);

export interface RichTextDoc {
  type: 'doc';
  content: RichBlock[];
}

/** Characters of text in the document (what the 2 000 limit counts). */
export const richTextLength = (node: unknown): number => {
  if (typeof node !== 'object' || node === null) {
    return 0;
  }
  const text = 'text' in node && typeof node.text === 'string' ? node.text.length : 0;
  const children = 'content' in node && Array.isArray(node.content) ? node.content : [];
  return text + children.reduce((sum: number, child: unknown) => sum + richTextLength(child), 0);
};

const depthOf = (node: unknown): number => {
  const children =
    typeof node === 'object' && node !== null && 'content' in node && Array.isArray(node.content)
      ? node.content
      : [];
  return 1 + children.reduce((max: number, child: unknown) => Math.max(max, depthOf(child)), 0);
};

export const RichTextDocSchema: z.ZodType<RichTextDoc> = z
  .strictObject({ type: z.literal('doc'), content: z.array(BlockSchema).min(1).max(MAX_NODES) })
  .refine((doc) => richTextLength(doc) <= FEEDBACK_MAX_TEXT, 'validation.feedback.textTooLong')
  .refine((doc) => depthOf(doc) <= MAX_DEPTH * 2, 'validation.invalid');

/** A document with no text is "no feedback". */
export const isEmptyRichText = (doc: RichTextDoc): boolean => richTextLength(doc) === 0;

/** Parses a stored value (jsonb) — anything not a valid document reads as no feedback. */
export const readRichText = (value: unknown): RichTextDoc | null => {
  const parsed = RichTextDocSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};
