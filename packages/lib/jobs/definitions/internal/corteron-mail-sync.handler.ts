import {
  deprovisionInactiveCorteronUsers,
  getCorteronMailConfig,
  syncCorteronPersonalTeams,
} from '../../../server-only/corteron/corteron-mail';
import type { JobRunIO } from '../../client/_internal/job';
import type { TCorteronMailSyncJobDefinition } from './corteron-mail-sync';

export const run = async ({ io }: { payload: TCorteronMailSyncJobDefinition; io: JobRunIO }) => {
  if (!getCorteronMailConfig()) {
    io.logger.info('Corteron Mail integration not configured, skipping');
    return;
  }

  const webhooks = await syncCorteronPersonalTeams();

  if (webhooks > 0) {
    io.logger.info(`Created or repaired ${webhooks} Corteron Mail webhook(s)`);
  }

  // Throws on any mailcow error, so a failing mailcow never disables anyone
  const result = await deprovisionInactiveCorteronUsers();

  if (result.skippedReason) {
    io.logger.error(`Corteron Mail deprovisioning skipped: ${result.skippedReason}`);
    return;
  }

  if (result.disabled.length > 0) {
    io.logger.info(
      `Disabled ${result.disabled.length} user(s) whose mailbox is inactive: ${result.disabled.join(', ')} (of ${result.checked} checked)`,
    );
  } else {
    io.logger.info(`All ${result.checked} Corteron Mail user(s) have an active mailbox`);
  }
};
