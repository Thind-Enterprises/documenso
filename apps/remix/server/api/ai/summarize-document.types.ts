import { ZEnvelopeAiSummaryContentSchema } from '@documenso/lib/types/envelope-ai-summary';
import { z } from 'zod';

export const ZSummarizeDocumentRequestSchema = z.object({
  token: z.string().min(1).describe('The signing token of the recipient requesting the summary.'),
});

export type TSummarizeDocumentRequest = z.infer<typeof ZSummarizeDocumentRequestSchema>;

export const ZSummarizeDocumentResponseSchema = z.object({
  summary: ZEnvelopeAiSummaryContentSchema,
  generatedAt: z.coerce.date(),
});

export type TSummarizeDocumentResponse = z.infer<typeof ZSummarizeDocumentResponseSchema>;
