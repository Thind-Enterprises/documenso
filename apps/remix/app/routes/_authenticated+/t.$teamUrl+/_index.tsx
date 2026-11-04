import { useSession } from '@documenso/lib/client-only/providers/session';
import { SKIP_QUERY_BATCH_META } from '@documenso/lib/constants/trpc';
import { formatDocumentsPath, formatTemplatesPath } from '@documenso/lib/utils/teams';
import { ExtendedDocumentStatus } from '@documenso/prisma/types/extended-document-status';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { EnvelopeType } from '@prisma/client';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2Icon,
  ClockIcon,
  FilePenLineIcon,
  LayoutTemplateIcon,
  PenLineIcon,
  SendIcon,
  SparklesIcon,
} from 'lucide-react';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { match, P } from 'ts-pattern';

import { EnvelopeDropZoneWrapper } from '~/components/general/envelope/envelope-drop-zone-wrapper';
import { EnvelopeUploadButton } from '~/components/general/envelope/envelope-upload-button';
import { HomeDocumentList } from '~/components/general/home/home-document-list';
import { HomeStatCard } from '~/components/general/home/home-stat-card';
import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Home`);
}

const HOME_LIST_PAGE_SIZE = 5;

export default function TeamHomePage() {
  const team = useCurrentTeam();
  const { user } = useSession();

  const documentsPath = formatDocumentsPath(team.url);
  const templatesPath = formatTemplatesPath(team.url);

  const queryOptions = {
    placeholderData: <T,>(previousData: T) => previousData,
    ...SKIP_QUERY_BATCH_META,
  };

  // Personal inbox: documents sent to the signed-in user that still need their action.
  const { data: inboxData, isLoading: isInboxLoading } = trpc.document.inbox.find.useQuery(
    {
      actionRequired: true,
      perPage: HOME_LIST_PAGE_SIZE,
    },
    queryOptions,
  );

  const { data: pendingData, isLoading: isPendingLoading } = trpc.document.findDocumentsInternal.useQuery(
    {
      status: ExtendedDocumentStatus.PENDING,
      perPage: HOME_LIST_PAGE_SIZE,
      includeAllFolders: true,
    },
    queryOptions,
  );

  const { data: completedData, isLoading: isCompletedLoading } = trpc.document.findDocumentsInternal.useQuery(
    {
      status: ExtendedDocumentStatus.COMPLETED,
      perPage: HOME_LIST_PAGE_SIZE,
      includeAllFolders: true,
    },
    queryOptions,
  );

  // Both team queries return the same team-wide stats, so use whichever arrives first.
  const stats = pendingData?.stats ?? completedData?.stats;
  const isStatsLoading = !stats;

  const actionRequiredCount = inboxData?.count;

  const firstName = user.name?.trim().split(/\s+/)[0] || undefined;

  // Resolved after mount so the greeting uses the viewer's local time, not the server's.
  const [greeting, setGreeting] = useState<Greeting | null>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <EnvelopeDropZoneWrapper type={EnvelopeType.DOCUMENT}>
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.16em]">{team.name}</p>

            <h1 className="font-semibold text-3xl text-foreground tracking-tight md:text-4xl">
              {match({ greeting, firstName })
                .with({ greeting: 'morning', firstName: P.string }, ({ firstName }) => (
                  <Trans>Good morning, {firstName}</Trans>
                ))
                .with({ greeting: 'afternoon', firstName: P.string }, ({ firstName }) => (
                  <Trans>Good afternoon, {firstName}</Trans>
                ))
                .with({ greeting: 'evening', firstName: P.string }, ({ firstName }) => (
                  <Trans>Good evening, {firstName}</Trans>
                ))
                .otherwise(() => (
                  <Trans>Welcome back</Trans>
                ))}
            </h1>

            <p className="text-muted-foreground">
              {match(actionRequiredCount)
                .with(undefined, () => <Trans>Here's what's happening with your documents.</Trans>)
                .with(0, () => <Trans>You're all caught up. Nothing is waiting for your signature.</Trans>)
                .with(1, () => <Trans>You have 1 document waiting for your signature.</Trans>)
                .otherwise((count) => (
                  <Trans>You have {count} documents waiting for your signature.</Trans>
                ))}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link to={templatesPath}>
                <LayoutTemplateIcon className="mr-2 -ml-1 size-4" />
                <Trans>Use a template</Trans>
              </Link>
            </Button>

            <EnvelopeUploadButton type={EnvelopeType.DOCUMENT} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <HomeStatCard
            tone="primary"
            to="/inbox"
            icon={PenLineIcon}
            label={<Trans>Needs your signature</Trans>}
            value={actionRequiredCount}
            isLoading={isInboxLoading}
          />

          <HomeStatCard
            to={`${documentsPath}?status=${ExtendedDocumentStatus.PENDING}`}
            icon={ClockIcon}
            label={<Trans>Waiting on others</Trans>}
            value={stats?.[ExtendedDocumentStatus.PENDING]}
            isLoading={isStatsLoading}
          />

          <HomeStatCard
            to={`${documentsPath}?status=${ExtendedDocumentStatus.DRAFT}`}
            icon={FilePenLineIcon}
            label={<Trans>Drafts</Trans>}
            value={stats?.[ExtendedDocumentStatus.DRAFT]}
            isLoading={isStatsLoading}
          />

          <HomeStatCard
            to={`${documentsPath}?status=${ExtendedDocumentStatus.COMPLETED}`}
            icon={CheckCircle2Icon}
            label={<Trans>Completed</Trans>}
            value={stats?.[ExtendedDocumentStatus.COMPLETED]}
            isLoading={isStatsLoading}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-6 lg:col-span-3">
            <HomeDocumentList
              variant="inbox"
              icon={PenLineIcon}
              title={<Trans>Waiting for you</Trans>}
              description={<Trans>Documents you've been asked to sign, approve or view.</Trans>}
              viewAllTo="/inbox"
              documents={inboxData?.data}
              isLoading={isInboxLoading}
              emptyState={
                <HomeListEmptyState
                  icon={CheckCircle2Icon}
                  title={<Trans>You're all caught up</Trans>}
                  description={<Trans>New signing requests will show up here.</Trans>}
                />
              }
            />

            <HomeDocumentList
              variant="pending"
              icon={SendIcon}
              title={<Trans>Waiting on others</Trans>}
              description={<Trans>Sent documents that still need signatures.</Trans>}
              viewAllTo={`${documentsPath}?status=${ExtendedDocumentStatus.PENDING}`}
              documents={pendingData?.data}
              isLoading={isPendingLoading}
              emptyState={
                <HomeListEmptyState
                  icon={SendIcon}
                  title={<Trans>Nothing out for signature</Trans>}
                  description={<Trans>Upload a document and add recipients to send it.</Trans>}
                />
              }
            />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <HomeDocumentList
              variant="completed"
              icon={CheckCircle2Icon}
              title={<Trans>Recently completed</Trans>}
              viewAllTo={`${documentsPath}?status=${ExtendedDocumentStatus.COMPLETED}`}
              documents={completedData?.data}
              isLoading={isCompletedLoading}
              emptyState={
                <HomeListEmptyState
                  icon={CheckCircle2Icon}
                  title={<Trans>No completed documents yet</Trans>}
                  description={<Trans>Fully signed documents will appear here.</Trans>}
                />
              }
            />

            <section className="flex flex-col gap-3 rounded-lg bg-auth-band p-5">
              <span
                aria-hidden
                className="inline-flex size-8 items-center justify-center rounded-md bg-card text-auth-accent shadow-paper-sm"
              >
                <SparklesIcon className="size-4" />
              </span>

              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-base text-foreground">
                  <Trans>Send faster with templates</Trans>
                </h2>
                <p className="text-muted-foreground text-sm">
                  <Trans>Save documents you send often as templates, with recipients and fields already placed.</Trans>
                </p>
              </div>

              <Button asChild variant="outline" className="w-fit bg-card">
                <Link to={templatesPath}>
                  <Trans>Browse templates</Trans>
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </EnvelopeDropZoneWrapper>
  );
}

type HomeListEmptyStateProps = {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
};

const HomeListEmptyState = ({ icon: Icon, title, description }: HomeListEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span
        aria-hidden
        className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Icon className="size-5" />
      </span>
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="max-w-xs text-muted-foreground text-xs">{description}</p>
    </div>
  );
};

type Greeting = 'morning' | 'afternoon' | 'evening';

const getGreeting = (): Greeting => {
  const hour = DateTime.now().hour;

  if (hour < 12) {
    return 'morning';
  }

  if (hour < 17) {
    return 'afternoon';
  }

  return 'evening';
};
