import { z } from 'zod';

import type { JobDefinition } from '../../client/_internal/job';

const CORTERON_MAIL_SYNC_JOB_DEFINITION_ID = 'internal.corteron-mail-sync';

const CORTERON_MAIL_SYNC_JOB_DEFINITION_SCHEMA = z.object({});

export type TCorteronMailSyncJobDefinition = z.infer<typeof CORTERON_MAIL_SYNC_JOB_DEFINITION_SCHEMA>;

/**
 * Corteron Mail integration: keeps personal-team webhooks and Reply-To current, and deprovisions users whose mailbox is no
 * longer active. A no-op unless NEXT_PRIVATE_CORTERON_MAIL_URL and the shared secret are set.
 */
export const CORTERON_MAIL_SYNC_JOB_DEFINITION = {
  id: CORTERON_MAIL_SYNC_JOB_DEFINITION_ID,
  name: 'Corteron Mail Sync',
  version: '1.0.0',
  trigger: {
    name: CORTERON_MAIL_SYNC_JOB_DEFINITION_ID,
    schema: CORTERON_MAIL_SYNC_JOB_DEFINITION_SCHEMA,
    cron: '17 * * * *', // Hourly.
  },
  handler: async ({ payload, io }) => {
    const handler = await import('./corteron-mail-sync.handler');

    await handler.run({ payload, io });
  },
} as const satisfies JobDefinition<typeof CORTERON_MAIL_SYNC_JOB_DEFINITION_ID, TCorteronMailSyncJobDefinition>;
