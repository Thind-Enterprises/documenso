import { createHash } from 'node:crypto';

import { prisma } from '@documenso/prisma';
import type { ImagePart, UserContent } from 'ai';
import { generateObject } from 'ai';

import { AppError, AppErrorCode } from '../../../../errors/app-error';
import { type TEnvelopeAiSummaryContent, ZEnvelopeAiSummaryContentSchema } from '../../../../types/envelope-ai-summary';
import { getFileServerSide } from '../../../../universal/upload/get-file.server';
import { vertex } from '../../google';
import { pdfToImages } from '../../pdf-to-images';
import { pdfToText } from '../../pdf-to-text';
import { buildSummaryUserPrompt, SYSTEM_PROMPT } from './prompt';

const SUMMARY_MODEL = 'gemini-3-flash-preview';

/**
 * Upper bound on the document text sent to the model, roughly 30k tokens.
 */
const MAX_DOCUMENT_CHARACTERS = 120_000;

/**
 * Pages to read per envelope item. Longer documents are summarised from their first pages.
 */
const MAX_PAGES_PER_ITEM = 60;

/**
 * Below this many characters of extracted text we treat the PDF as scanned and send page images instead.
 */
const MIN_TEXT_CHARACTERS = 200;

/**
 * Scanned documents are sent as images, which is far more expensive, so cap them tighter.
 */
const MAX_SCANNED_PAGES = 15;

export type EnvelopeAiSummaryResult = {
  summary: TEnvelopeAiSummaryContent;
  generatedAt: Date;
  isCached: boolean;
};

export type GetOrCreateEnvelopeAiSummaryOptions = {
  envelopeId: string;
};

/**
 * Return the cached AI summary for an envelope, generating and storing a new one when there is none
 * or the envelope's documents have changed since it was generated.
 *
 * Callers are responsible for checking the requester may read the envelope and that AI features are enabled.
 */
export const getOrCreateEnvelopeAiSummary = async ({
  envelopeId,
}: GetOrCreateEnvelopeAiSummaryOptions): Promise<EnvelopeAiSummaryResult> => {
  const envelope = await prisma.envelope.findUnique({
    where: { id: envelopeId },
    include: {
      documentMeta: { select: { language: true } },
      envelopeItems: {
        orderBy: { order: 'asc' },
        include: { documentData: true },
      },
      aiSummary: true,
    },
  });

  if (!envelope) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Envelope not found',
    });
  }

  const language = envelope.documentMeta.language || 'en';

  const sourceHash = createHash('sha256')
    .update(JSON.stringify({ language, items: envelope.envelopeItems.map((item) => item.documentDataId) }))
    .digest('hex');

  if (envelope.aiSummary && envelope.aiSummary.sourceHash === sourceHash) {
    const cached = ZEnvelopeAiSummaryContentSchema.safeParse(envelope.aiSummary.summary);

    if (cached.success) {
      return {
        summary: cached.data,
        generatedAt: envelope.aiSummary.updatedAt,
        isCached: true,
      };
    }
  }

  const documentContent = await buildDocumentContent({
    title: envelope.title,
    language,
    items: envelope.envelopeItems,
  });

  const result = await generateObject({
    model: vertex(SUMMARY_MODEL),
    system: SYSTEM_PROMPT,
    schema: ZEnvelopeAiSummaryContentSchema,
    messages: [{ role: 'user', content: documentContent }],
    temperature: 0.2,
  });

  const summary = ZEnvelopeAiSummaryContentSchema.parse(result.object);

  const stored = await prisma.envelopeAiSummary.upsert({
    where: { envelopeId },
    create: {
      envelopeId,
      sourceHash,
      language,
      model: SUMMARY_MODEL,
      summary,
    },
    update: {
      sourceHash,
      language,
      model: SUMMARY_MODEL,
      summary,
    },
  });

  return {
    summary,
    generatedAt: stored.updatedAt,
    isCached: false,
  };
};

type BuildDocumentContentOptions = {
  title: string;
  language: string;
  items: {
    title: string;
    documentData: Parameters<typeof getFileServerSide>[0];
  }[];
};

const buildDocumentContent = async ({ title, language, items }: BuildDocumentContentOptions): Promise<UserContent> => {
  const languageName = getLanguageName(language);

  const files = await Promise.all(
    items.map(async (item) => ({
      title: item.title,
      bytes: await getFileServerSide(item.documentData),
    })),
  );

  const extracted = await Promise.all(
    files.map(async (file) => ({
      title: file.title,
      bytes: file.bytes,
      ...(await pdfToText(file.bytes, { maxPages: MAX_PAGES_PER_ITEM })),
    })),
  );

  const sections = extracted.map((file) => {
    const pagesText = file.pages
      .filter((page) => page.text.length > 0)
      .map((page) => `--- Page ${page.pageNumber} ---\n${page.text}`)
      .join('\n\n');

    return `=== ${file.title} ===\n${pagesText}`;
  });

  const fullText = sections.join('\n\n');
  const textCharacterCount = extracted.reduce(
    (total, file) => total + file.pages.reduce((sum, page) => sum + page.text.length, 0),
    0,
  );

  const hasTextLayer = textCharacterCount >= MIN_TEXT_CHARACTERS;

  if (hasTextLayer) {
    const isTruncated =
      fullText.length > MAX_DOCUMENT_CHARACTERS || extracted.some((file) => file.totalPages > MAX_PAGES_PER_ITEM);

    return [
      {
        type: 'text',
        text: buildSummaryUserPrompt({
          title,
          languageName,
          documentText: fullText.slice(0, MAX_DOCUMENT_CHARACTERS),
          isTruncated,
        }),
      },
    ];
  }

  // Scanned document: fall back to page images.
  const totalPages = extracted.reduce((total, file) => total + file.totalPages, 0);

  if (totalPages > MAX_SCANNED_PAGES) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: `This document appears to be scanned and is too long to summarise (more than ${MAX_SCANNED_PAGES} pages).`,
    });
  }

  const pageImages = (await Promise.all(extracted.map(async (file) => pdfToImages(file.bytes, { scale: 1.5 })))).flat();

  return [
    {
      type: 'text',
      text: buildSummaryUserPrompt({
        title,
        languageName,
        documentText: 'The document is scanned. Its pages are attached as images after this message.',
        isTruncated: false,
      }),
    },
    ...pageImages.map<ImagePart>((page) => ({ type: 'image', image: page.image })),
  ];
};

const getLanguageName = (languageCode: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(languageCode) ?? 'English';
  } catch {
    return 'English';
  }
};
