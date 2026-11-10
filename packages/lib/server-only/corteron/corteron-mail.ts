/**
 * Corteron Mail integration (the Documenso side).
 *
 * Users sign in through Corteron Mail (mailcow) with OpenID Connect; that part is configuration only.
 * This module adds what configuration cannot:
 *
 * - a webhook on every user's personal team that reports document status back to the mail UI
 * - Reply-To on the personal team set to the user's mailbox, so replies to signing emails sent
 *   from the shared sign@ address reach the person who sent the document
 * - deprovisioning: users whose mailbox is no longer active are disabled and signed out
 *
 * Both sides share one secret, `NEXT_PRIVATE_CORTERON_SHARED_SECRET`, from which purpose-specific
 * secrets are derived (mailcow: data/web/inc/functions.corteron_sign.inc.php):
 *
 * - webhook secret of a mailbox = HMAC-SHA256(shared, "webhook:" + lowercase(email))
 * - mailbox-status bearer token = HMAC-SHA256(shared, "mailbox-status")
 *
 * Nothing here runs unless `NEXT_PRIVATE_CORTERON_MAIL_URL` and the shared secret are set.
 */
import { createHmac } from 'node:crypto';

import { prisma } from '@documenso/prisma';
import { OrganisationType, WebhookTriggerEvents } from '@prisma/client';

import { env } from '../../utils/env';
import { fetchWithTimeout } from '../../utils/timeout';

export const CORTERON_OIDC_PROVIDER_ID = 'oidc';

export const CORTERON_WEBHOOK_EVENTS: WebhookTriggerEvents[] = [
  WebhookTriggerEvents.DOCUMENT_CREATED,
  WebhookTriggerEvents.DOCUMENT_SENT,
  WebhookTriggerEvents.DOCUMENT_OPENED,
  WebhookTriggerEvents.DOCUMENT_SIGNED,
  WebhookTriggerEvents.DOCUMENT_RECIPIENT_COMPLETED,
  WebhookTriggerEvents.DOCUMENT_COMPLETED,
  WebhookTriggerEvents.DOCUMENT_REJECTED,
  WebhookTriggerEvents.DOCUMENT_CANCELLED,
  WebhookTriggerEvents.RECIPIENT_EXPIRED,
];

/** Mailbox-status requests are batched; mailcow refuses more than 500 addresses per request. */
const STATUS_BATCH_SIZE = 200;

const STATUS_TIMEOUT_MS = 10_000;

/**
 * If more than this share of checked users would be disabled in one run, nothing is disabled:
 * a mass "inactive" answer is far more likely a mailcow fault than a mass offboarding.
 */
const MAX_DISABLE_SHARE = 0.2;

/** Below this many users the share check is skipped, so small installs can still offboard. */
const MAX_DISABLE_SHARE_MIN_USERS = 10;

export type CorteronMailConfig = {
  mailUrl: string;
  sharedSecret: string;
};

export const getCorteronMailConfig = (): CorteronMailConfig | null => {
  const mailUrl = env('NEXT_PRIVATE_CORTERON_MAIL_URL')?.trim().replace(/\/+$/, '');
  const sharedSecret = env('NEXT_PRIVATE_CORTERON_SHARED_SECRET')?.trim();

  if (!mailUrl || !sharedSecret) {
    return null;
  }

  if (!mailUrl.startsWith('https://')) {
    throw new Error('NEXT_PRIVATE_CORTERON_MAIL_URL must be an https:// URL');
  }

  return { mailUrl, sharedSecret };
};

const deriveSecret = (config: CorteronMailConfig, purpose: string) =>
  createHmac('sha256', config.sharedSecret).update(purpose).digest('hex');

export const getCorteronWebhookSecret = (config: CorteronMailConfig, email: string) =>
  deriveSecret(config, `webhook:${email.trim().toLowerCase()}`);

export const getCorteronStatusToken = (config: CorteronMailConfig) => deriveSecret(config, 'mailbox-status');

const getWebhookUrlPrefix = (config: CorteronMailConfig) => `${config.mailUrl}/esign/webhook.php?`;

export const getCorteronWebhookUrl = (config: CorteronMailConfig, email: string, teamUrl: string) => {
  const params = new URLSearchParams({ owner: email.trim().toLowerCase(), team: teamUrl });

  return `${getWebhookUrlPrefix(config)}${params.toString()}`;
};

const hasSameEvents = (a: WebhookTriggerEvents[], b: WebhookTriggerEvents[]) =>
  a.length === b.length && a.every((event) => b.includes(event));

/**
 * Set up each personal team of the user for Corteron Mail:
 *
 * - creates the status webhook, or repairs it when its URL, secret or events no longer match
 *   (for example after an email change)
 * - sets Reply-To to the user's mailbox while the team has none, so a choice the user made in
 *   the team settings is kept
 *
 * Other teams are never touched.
 *
 * @returns the number of webhooks created or updated
 */
export const ensureCorteronPersonalTeamSetup = async (userId: number) => {
  const config = getCorteronMailConfig();

  if (!config) {
    return 0;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return 0;
  }

  const teams = await prisma.team.findMany({
    where: {
      organisation: {
        type: OrganisationType.PERSONAL,
        ownerUserId: user.id,
      },
    },
    select: {
      id: true,
      url: true,
      teamGlobalSettingsId: true,
      teamGlobalSettings: { select: { emailReplyTo: true } },
      webhooks: {
        where: { webhookUrl: { startsWith: getWebhookUrlPrefix(config) } },
        select: { id: true, webhookUrl: true, secret: true, eventTriggers: true, enabled: true },
      },
    },
  });

  let changed = 0;

  for (const team of teams) {
    if (!team.teamGlobalSettings.emailReplyTo) {
      await prisma.teamGlobalSettings.update({
        where: { id: team.teamGlobalSettingsId },
        data: { emailReplyTo: user.email },
      });
    }

    const webhookUrl = getCorteronWebhookUrl(config, user.email, team.url);
    const secret = getCorteronWebhookSecret(config, user.email);
    const [existing, ...duplicates] = team.webhooks;

    if (!existing) {
      await prisma.webhook.create({
        data: {
          webhookUrl,
          secret,
          eventTriggers: CORTERON_WEBHOOK_EVENTS,
          enabled: true,
          userId: user.id,
          teamId: team.id,
        },
      });

      changed++;
      continue;
    }

    const isCurrent =
      existing.webhookUrl === webhookUrl &&
      existing.secret === secret &&
      existing.enabled &&
      hasSameEvents(existing.eventTriggers, CORTERON_WEBHOOK_EVENTS);

    if (!isCurrent) {
      await prisma.webhook.update({
        where: { id: existing.id },
        data: { webhookUrl, secret, eventTriggers: CORTERON_WEBHOOK_EVENTS, enabled: true },
      });

      changed++;
    }

    if (duplicates.length > 0) {
      await prisma.webhook.deleteMany({ where: { id: { in: duplicates.map((webhook) => webhook.id) } } });
    }
  }

  return changed;
};

/**
 * Runs the personal-team setup for every active user who signs in through Corteron Mail. Covers
 * users created before the integration, webhooks whose creation failed, email changes and a
 * rotated shared secret. Writes only where something differs.
 */
export const syncCorteronPersonalTeams = async () => {
  const config = getCorteronMailConfig();

  if (!config) {
    return 0;
  }

  const owners = await prisma.organisation.findMany({
    where: {
      type: OrganisationType.PERSONAL,
      owner: {
        disabled: false,
        accounts: { some: { provider: CORTERON_OIDC_PROVIDER_ID } },
      },
    },
    select: { ownerUserId: true },
    distinct: ['ownerUserId'],
  });

  let changed = 0;

  for (const { ownerUserId } of owners) {
    changed += await ensureCorteronPersonalTeamSetup(ownerUserId);
  }

  return changed;
};

const fetchActiveMailboxes = async (config: CorteronMailConfig, emails: string[]) => {
  const response = await fetchWithTimeout(`${config.mailUrl}/esign/mailbox-status.php`, {
    method: 'POST',
    redirect: 'error',
    timeoutMs: STATUS_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${getCorteronStatusToken(config)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emails }),
  });

  if (!response.ok) {
    throw new Error(`Corteron Mail mailbox-status answered ${response.status}`);
  }

  const body: unknown = await response.json();
  const active =
    typeof body === 'object' && body !== null && 'active' in body ? (body as { active: unknown }).active : null;

  if (typeof active !== 'object' || active === null) {
    throw new Error('Corteron Mail mailbox-status sent an unexpected body');
  }

  return active as Record<string, unknown>;
};

export type CorteronDeprovisionResult = {
  checked: number;
  disabled: number[];
  skippedReason?: string;
};

/**
 * Disable and sign out users who came in through Corteron Mail and whose mailbox is no longer
 * active. Only an explicit `false` from mailcow disables a user; errors and missing answers
 * leave everyone as they are. Re-enabling is a manual step in the Documenso admin panel.
 */
export const deprovisionInactiveCorteronUsers = async (): Promise<CorteronDeprovisionResult> => {
  const config = getCorteronMailConfig();

  if (!config) {
    return { checked: 0, disabled: [], skippedReason: 'not configured' };
  }

  const users = await prisma.user.findMany({
    where: {
      disabled: false,
      accounts: { some: { provider: CORTERON_OIDC_PROVIDER_ID } },
    },
    select: { id: true, email: true },
    orderBy: { id: 'asc' },
  });

  const inactive: { id: number; email: string }[] = [];

  for (let i = 0; i < users.length; i += STATUS_BATCH_SIZE) {
    const batch = users.slice(i, i + STATUS_BATCH_SIZE);
    const active = await fetchActiveMailboxes(
      config,
      batch.map((user) => user.email.toLowerCase()),
    );

    for (const user of batch) {
      if (active[user.email.toLowerCase()] === false) {
        inactive.push(user);
      }
    }
  }

  if (inactive.length === 0) {
    return { checked: users.length, disabled: [] };
  }

  if (users.length >= MAX_DISABLE_SHARE_MIN_USERS && inactive.length / users.length > MAX_DISABLE_SHARE) {
    return {
      checked: users.length,
      disabled: [],
      skippedReason: `${inactive.length} of ${users.length} users reported inactive, above the safety limit; nothing disabled`,
    };
  }

  for (const user of inactive) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { disabled: true } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);
  }

  return { checked: users.length, disabled: inactive.map((user) => user.id) };
};
