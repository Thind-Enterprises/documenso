import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  team: { findMany: vi.fn() },
  organisation: { findMany: vi.fn() },
  webhook: { create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
  teamGlobalSettings: { update: vi.fn() },
  session: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@documenso/prisma', () => ({ prisma: prismaMock }));

import {
  CORTERON_WEBHOOK_EVENTS,
  deprovisionInactiveCorteronUsers,
  ensureCorteronPersonalTeamSetup,
  getCorteronMailConfig,
  getCorteronStatusToken,
  getCorteronWebhookSecret,
  getCorteronWebhookUrl,
} from './corteron-mail';

const SHARED = 'a'.repeat(64);
const MAIL_URL = 'https://mail.corteron.com';

// the derivation mailcow uses (data/web/inc/functions.corteron_sign.inc.php)
const hmac = (purpose: string) => createHmac('sha256', SHARED).update(purpose).digest('hex');

const requireConfig = () => {
  const config = getCorteronMailConfig();

  if (!config) {
    throw new Error('Corteron Mail config missing in test');
  }

  return config;
};

const okResponse = (active: Record<string, boolean>) =>
  new Response(JSON.stringify({ active }), { status: 200, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  vi.stubEnv('NEXT_PRIVATE_CORTERON_MAIL_URL', `${MAIL_URL}/`);
  vi.stubEnv('NEXT_PRIVATE_CORTERON_SHARED_SECRET', SHARED);
  for (const model of Object.values(prismaMock)) {
    if (typeof model === 'function') {
      model.mockReset();
    } else {
      for (const fn of Object.values(model)) {
        fn.mockReset();
      }
    }
  }
  prismaMock.$transaction.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('config and secrets', () => {
  it('is off without both variables', () => {
    vi.stubEnv('NEXT_PRIVATE_CORTERON_SHARED_SECRET', '');
    expect(getCorteronMailConfig()).toBeNull();
  });

  it('rejects a non-https mail URL', () => {
    vi.stubEnv('NEXT_PRIVATE_CORTERON_MAIL_URL', 'http://mail.corteron.com');
    expect(() => getCorteronMailConfig()).toThrow();
  });

  it('derives the same secrets as mailcow', () => {
    const config = requireConfig();
    expect(config.mailUrl).toBe(MAIL_URL);
    expect(getCorteronWebhookSecret(config, ' Jane@Corteron.com ')).toBe(hmac('webhook:jane@corteron.com'));
    expect(getCorteronStatusToken(config)).toBe(hmac('mailbox-status'));
  });

  it('builds the webhook URL mailcow expects', () => {
    const config = requireConfig();
    expect(getCorteronWebhookUrl(config, 'Jane+x@Corteron.com', 'personal_abc')).toBe(
      `${MAIL_URL}/esign/webhook.php?owner=jane%2Bx%40corteron.com&team=personal_abc`,
    );
  });
});

describe('ensureCorteronPersonalTeamSetup', () => {
  it('creates the webhook and sets Reply-To on a new personal team', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, email: 'jane@corteron.com' });
    prismaMock.team.findMany.mockResolvedValue([
      {
        id: 3,
        url: 'personal_abc',
        teamGlobalSettingsId: 'tgs3',
        teamGlobalSettings: { emailReplyTo: null },
        webhooks: [],
      },
    ]);

    await expect(ensureCorteronPersonalTeamSetup(7)).resolves.toBe(1);
    expect(prismaMock.webhook.create).toHaveBeenCalledWith({
      data: {
        webhookUrl: `${MAIL_URL}/esign/webhook.php?owner=jane%40corteron.com&team=personal_abc`,
        secret: hmac('webhook:jane@corteron.com'),
        eventTriggers: CORTERON_WEBHOOK_EVENTS,
        enabled: true,
        userId: 7,
        teamId: 3,
      },
    });
    expect(prismaMock.teamGlobalSettings.update).toHaveBeenCalledWith({
      where: { id: 'tgs3' },
      data: { emailReplyTo: 'jane@corteron.com' },
    });
  });

  it('leaves a current webhook alone and repairs a stale one', async () => {
    const config = requireConfig();
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, email: 'jane@corteron.com' });
    prismaMock.team.findMany.mockResolvedValue([
      {
        id: 3,
        url: 'personal_abc',
        teamGlobalSettingsId: 'tgs3',
        teamGlobalSettings: { emailReplyTo: 'own-choice@corteron.com' },
        webhooks: [
          {
            id: 'current',
            webhookUrl: getCorteronWebhookUrl(config, 'jane@corteron.com', 'personal_abc'),
            secret: hmac('webhook:jane@corteron.com'),
            eventTriggers: [...CORTERON_WEBHOOK_EVENTS].reverse(),
            enabled: true,
          },
        ],
      },
      {
        id: 4,
        url: 'personal_def',
        teamGlobalSettingsId: 'tgs4',
        teamGlobalSettings: { emailReplyTo: 'other@corteron.com' },
        webhooks: [
          { id: 'stale', webhookUrl: 'old', secret: 'old', eventTriggers: [], enabled: false },
          { id: 'dupe', webhookUrl: 'old', secret: 'old', eventTriggers: [], enabled: true },
        ],
      },
    ]);

    await expect(ensureCorteronPersonalTeamSetup(7)).resolves.toBe(1);
    expect(prismaMock.webhook.create).not.toHaveBeenCalled();
    expect(prismaMock.webhook.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.webhook.update.mock.calls[0][0].where).toEqual({ id: 'stale' });
    expect(prismaMock.webhook.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['dupe'] } } });
    // a Reply-To the user chose is kept
    expect(prismaMock.teamGlobalSettings.update).not.toHaveBeenCalled();
  });

  it('does nothing when not configured', async () => {
    vi.stubEnv('NEXT_PRIVATE_CORTERON_MAIL_URL', '');
    await expect(ensureCorteronPersonalTeamSetup(7)).resolves.toBe(0);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('deprovisionInactiveCorteronUsers', () => {
  const users = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: i + 1, email: `User${i + 1}@corteron.com` }));

  it('disables and signs out only users mailcow reports as inactive', async () => {
    prismaMock.user.findMany.mockResolvedValue(users(3));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ 'user1@corteron.com': true, 'user2@corteron.com': false }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await deprovisionInactiveCorteronUsers();

    expect(result).toEqual({ checked: 3, disabled: [2] });
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { disabled: true } });
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 2 } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${MAIL_URL}/esign/mailbox-status.php`);
    expect(init.headers.Authorization).toBe(`Bearer ${hmac('mailbox-status')}`);
    expect(JSON.parse(init.body).emails).toEqual(['user1@corteron.com', 'user2@corteron.com', 'user3@corteron.com']);
  });

  it('batches requests', async () => {
    prismaMock.user.findMany.mockResolvedValue(users(450));
    const fetchMock = vi.fn().mockImplementation(async () => okResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await deprovisionInactiveCorteronUsers();

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws on a mailcow error and disables nobody', async () => {
    prismaMock.user.findMany.mockResolvedValue(users(3));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));

    await expect(deprovisionInactiveCorteronUsers()).rejects.toThrow('503');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('refuses a mass disable', async () => {
    prismaMock.user.findMany.mockResolvedValue(users(20));
    const all = Object.fromEntries(users(20).map((user) => [user.email.toLowerCase(), false]));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(all)));

    const result = await deprovisionInactiveCorteronUsers();

    expect(result.disabled).toEqual([]);
    expect(result.skippedReason).toContain('safety limit');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
