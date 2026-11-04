import { getOptionalSession } from '@documenso/auth/server/lib/utils/get-session';
import { IS_AI_FEATURES_CONFIGURED } from '@documenso/lib/constants/app';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { getOrCreateEnvelopeAiSummary } from '@documenso/lib/server-only/ai/envelope/summarize-document';
import { getTeamSettings } from '@documenso/lib/server-only/team/get-team-settings';
import { DocumentAccessAuth } from '@documenso/lib/types/document-auth';
import { extractDocumentAuthMethods } from '@documenso/lib/utils/document-auth';
import { prisma } from '@documenso/prisma';
import { sValidator } from '@hono/standard-validator';
import { DocumentStatus, EnvelopeType } from '@prisma/client';
import { Hono } from 'hono';
import { streamText } from 'hono/streaming';

import type { HonoEnv } from '../../router';
import { ZSummarizeDocumentRequestSchema } from './summarize-document.types';

const KEEPALIVE_INTERVAL_MS = 5000;

const SUMMARIZABLE_STATUSES: DocumentStatus[] = [DocumentStatus.PENDING, DocumentStatus.COMPLETED];

export const summarizeDocumentRoute = new Hono<HonoEnv>().post(
  '/',
  sValidator('json', ZSummarizeDocumentRequestSchema),
  async (c) => {
    const logger = c.get('logger');

    try {
      const { token } = c.req.valid('json');

      const recipient = await prisma.recipient.findFirst({
        where: { token },
        include: {
          envelope: {
            select: {
              id: true,
              type: true,
              status: true,
              deletedAt: true,
              teamId: true,
              authOptions: true,
            },
          },
        },
      });

      const envelope = recipient?.envelope;

      if (
        !recipient ||
        !envelope ||
        envelope.type !== EnvelopeType.DOCUMENT ||
        envelope.deletedAt ||
        !SUMMARIZABLE_STATUSES.includes(envelope.status)
      ) {
        throw new AppError(AppErrorCode.NOT_FOUND, {
          message: 'Document not found',
        });
      }

      // Mirror the signing page: an account-restricted document can only be read by that account.
      const { derivedRecipientAccessAuth } = extractDocumentAuthMethods({
        documentAuth: envelope.authOptions,
        recipientAuth: recipient.authOptions,
      });

      if (derivedRecipientAccessAuth.includes(DocumentAccessAuth.ACCOUNT)) {
        const { user } = await getOptionalSession(c);

        if (!user || user.email !== recipient.email) {
          throw new AppError(AppErrorCode.UNAUTHORIZED, {
            message: 'You must be signed in as the recipient to summarise this document',
          });
        }
      }

      const { aiFeaturesEnabled } = await getTeamSettings({ teamId: envelope.teamId });

      if (!aiFeaturesEnabled) {
        throw new AppError(AppErrorCode.UNAUTHORIZED, {
          message: 'AI features are not enabled for this document',
        });
      }

      if (!IS_AI_FEATURES_CONFIGURED()) {
        throw new AppError(AppErrorCode.INVALID_REQUEST, {
          message: 'AI features are not configured. Please contact support to enable AI features.',
        });
      }

      logger.info({
        event: 'ai.summarize-document.start',
        envelopeId: envelope.id,
        recipientId: recipient.id,
      });

      return streamText(c, async (stream) => {
        let interval: NodeJS.Timeout | null = setInterval(() => {
          void stream.writeln(JSON.stringify({ type: 'keepalive' }));
        }, KEEPALIVE_INTERVAL_MS);

        try {
          const result = await getOrCreateEnvelopeAiSummary({ envelopeId: envelope.id });

          if (interval) {
            clearInterval(interval);
            interval = null;
          }

          logger.info({
            event: 'ai.summarize-document.complete',
            envelopeId: envelope.id,
            recipientId: recipient.id,
            isCached: result.isCached,
          });

          await stream.writeln(
            JSON.stringify({
              type: 'complete',
              summary: result.summary,
              generatedAt: result.generatedAt,
            }),
          );
        } catch (error) {
          if (interval) {
            clearInterval(interval);
          }

          console.error(error);

          logger.error({
            event: 'ai.summarize-document.error',
            error,
          });

          // Only expose messages we wrote ourselves; provider errors can leak configuration details.
          const message = error instanceof AppError ? error.message : '';

          await stream.writeln(
            JSON.stringify({
              type: 'error',
              message,
            }),
          );
        }
      });
    } catch (error) {
      logger.error({
        event: 'ai.summarize-document.error',
        error,
      });

      if (error instanceof AppError) {
        const { status, body } = AppError.toRestAPIError(error);

        return c.json(body, status);
      }

      return c.json({ message: 'Failed to summarise the document' }, 500);
    }
  },
);
