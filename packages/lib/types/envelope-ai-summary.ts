import { z } from 'zod';

export const ZEnvelopeAiSummaryAttentionPointSchema = z.object({
  title: z.string().describe('A short label for the clause or term, at most 8 words.'),
  detail: z
    .string()
    .describe('One or two plain-language sentences explaining what it means for the recipient and why it matters.'),
  severity: z
    .enum(['info', 'caution', 'warning'])
    .describe(
      'info for neutral notable terms, caution for terms worth reading carefully, warning for terms that are unusual, one-sided or costly for the recipient.',
    ),
});

export const ZEnvelopeAiSummaryContentSchema = z.object({
  documentType: z.string().describe('The kind of document, for example "Mutual non-disclosure agreement".'),
  overview: z
    .string()
    .describe('Two to four plain-language sentences summarising what the document is and what signing it means.'),
  parties: z
    .array(
      z.object({
        name: z.string().describe('The party name exactly as written in the document.'),
        role: z.string().describe('Their role, for example "Employer", "Contractor", "Disclosing party".'),
      }),
    )
    .describe('The parties named in the document. Empty if none are named.'),
  keyPoints: z
    .array(
      z.object({
        title: z.string().describe('A short label, at most 8 words.'),
        detail: z.string().describe('One or two plain-language sentences.'),
      }),
    )
    .describe('The three to six most important terms: what each party gets, owes or must do.'),
  importantDates: z
    .array(
      z.object({
        label: z.string().describe('What the date or period is, for example "Notice period".'),
        value: z.string().describe('The date or duration exactly as stated, for example "30 days" or "1 March 2027".'),
      }),
    )
    .describe('Deadlines, durations, renewal and notice periods. Empty if none are stated.'),
  attentionPoints: z
    .array(ZEnvelopeAiSummaryAttentionPointSchema)
    .describe(
      'Clauses the recipient should read carefully before signing: payments, penalties, liability, indemnity, termination, auto-renewal, exclusivity, non-compete, data use. Empty if none.',
    ),
});

export type TEnvelopeAiSummaryContent = z.infer<typeof ZEnvelopeAiSummaryContentSchema>;
export type TEnvelopeAiSummaryAttentionPoint = z.infer<typeof ZEnvelopeAiSummaryAttentionPointSchema>;
