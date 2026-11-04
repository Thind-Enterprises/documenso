import { formatPath } from '@documenso/lib/constants/app';
import { ZEnvelopeAiSummaryContentSchema } from '@documenso/lib/types/envelope-ai-summary';
import { z } from 'zod';

import type { TSummarizeDocumentRequest, TSummarizeDocumentResponse } from './summarize-document.types';

export type { TSummarizeDocumentRequest, TSummarizeDocumentResponse };

const ZStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('keepalive') }),
  z.object({ type: z.literal('error'), message: z.string() }),
  z.object({
    type: z.literal('complete'),
    summary: ZEnvelopeAiSummaryContentSchema,
    generatedAt: z.coerce.date(),
  }),
]);

const ZApiErrorResponseSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
});

export class SummarizeDocumentError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'SummarizeDocumentError';
  }
}

/**
 * Request an AI summary of the document behind a recipient signing token.
 *
 * Resolves with the summary, or rejects with a `SummarizeDocumentError`.
 */
export const summarizeDocument = async (
  request: TSummarizeDocumentRequest,
  signal?: AbortSignal,
): Promise<TSummarizeDocumentResponse> => {
  const response = await fetch(formatPath('/api/ai/summarize-document'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    const parsed = ZApiErrorResponseSchema.safeParse(safeJsonParse(text));
    const message = parsed.success ? (parsed.data.message ?? parsed.data.error) : undefined;

    throw new SummarizeDocumentError(message ?? 'Failed to summarise the document', response.status);
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new SummarizeDocumentError('No response body', 500);
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const event = ZStreamEventSchema.safeParse(safeJsonParse(line));

        if (!event.success) {
          console.warn('Failed to parse stream event:', line);
          continue;
        }

        if (event.data.type === 'error') {
          throw new SummarizeDocumentError(event.data.message, 500);
        }

        if (event.data.type === 'complete') {
          return {
            summary: event.data.summary,
            generatedAt: event.data.generatedAt,
          };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new SummarizeDocumentError('The summary stream ended unexpectedly', 500);
};

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
