import { useSession } from '@documenso/lib/client-only/providers/session';
import type { TDocumentMany } from '@documenso/lib/types/document';
import { findRecipientByEmail } from '@documenso/lib/utils/recipients';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { RecipientRole, SigningStatus } from '@prisma/client';
import type { LucideIcon } from 'lucide-react';
import { ArrowRightIcon, FileTextIcon, TimerIcon } from 'lucide-react';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { match } from 'ts-pattern';

import { StackAvatarsWithTooltip } from '~/components/general/stack-avatars-with-tooltip';
import { useCurrentTeam } from '~/providers/team';

export type HomeDocumentListVariant = 'inbox' | 'pending' | 'completed';

export type HomeDocumentListProps = {
  variant: HomeDocumentListVariant;
  title: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  viewAllTo: string;
  documents?: TDocumentMany[];
  isLoading?: boolean;
  emptyState: ReactNode;
  className?: string;
};

export const HomeDocumentList = ({
  variant,
  title,
  description,
  icon: Icon,
  viewAllTo,
  documents,
  isLoading = false,
  emptyState,
  className,
}: HomeDocumentListProps) => {
  const isEmpty = !isLoading && documents?.length === 0;

  return (
    <section className={cn('flex flex-col rounded-lg bg-card shadow-auth-float', className)}>
      <header className="flex items-start justify-between gap-4 border-border border-b px-5 py-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-auth-band text-auth-accent"
          >
            <Icon className="size-4" />
          </span>

          <div className="flex flex-col">
            <h2 className="font-semibold text-base text-foreground">{title}</h2>
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>
        </div>

        <Link
          to={viewAllTo}
          className="inline-flex shrink-0 items-center gap-1 rounded-md font-medium text-link text-sm ring-offset-background hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Trans>View all</Trans>
          <ArrowRightIcon className="size-3.5" aria-hidden />
        </Link>
      </header>

      {isLoading && (
        <ul className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="size-9 rounded-md" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {isEmpty && <div className="flex flex-1 items-center justify-center px-5 py-10">{emptyState}</div>}

      {!isLoading && documents && documents.length > 0 && (
        <ul className="divide-y divide-border">
          {documents.map((document) => (
            <HomeDocumentListRow key={document.envelopeId} variant={variant} document={document} />
          ))}
        </ul>
      )}
    </section>
  );
};

type HomeDocumentListRowProps = {
  variant: HomeDocumentListVariant;
  document: TDocumentMany;
};

const HomeDocumentListRow = ({ variant, document }: HomeDocumentListRowProps) => {
  const { i18n } = useLingui();
  const { user } = useSession();
  const team = useCurrentTeam();

  const recipient = findRecipientByEmail({
    recipients: document.recipients,
    userEmail: user.email,
    teamEmail: team.teamEmail?.email,
  });

  const documentPath = `${formatDocumentsPath(team.url)}/${document.envelopeId}`;
  const isMySigningTurn = variant === 'inbox' && recipient && recipient.signingStatus !== SigningStatus.SIGNED;
  const href = isMySigningTurn ? `/sign/${recipient.token}` : documentPath;

  const senderName = document.user.name || document.user.email;
  const completedAgo = formatRelative(document.completedAt ?? document.updatedAt, i18n.locale);

  return (
    <li className="group relative flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50">
      <span
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
      >
        <FileTextIcon className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          to={href}
          title={document.title}
          className="truncate font-medium text-foreground text-sm after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {document.title}
        </Link>

        <span className="truncate text-muted-foreground text-xs">
          {match(variant)
            .with('inbox', () => <Trans>From {senderName}</Trans>)
            .with('pending', () => <PendingProgress document={document} />)
            .with('completed', () => <Trans>Completed {completedAgo}</Trans>)
            .exhaustive()}
        </span>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-3">
        {variant === 'pending' && <ExpiryBadge document={document} />}

        {variant !== 'inbox' && (
          <div className="hidden sm:block">
            <StackAvatarsWithTooltip recipients={document.recipients} documentStatus={document.status} />
          </div>
        )}

        {isMySigningTurn && (
          <Button asChild size="sm" className="h-8">
            <Link to={href}>
              {match(recipient.role)
                .with(RecipientRole.APPROVER, () => <Trans>Approve</Trans>)
                .with(RecipientRole.VIEWER, () => <Trans>View</Trans>)
                .with(RecipientRole.ASSISTANT, () => <Trans>Assist</Trans>)
                .otherwise(() => (
                  <Trans>Sign</Trans>
                ))}
            </Link>
          </Button>
        )}

        {variant === 'inbox' && !isMySigningTurn && (
          <span className="font-mono text-muted-foreground text-xs">
            {formatRelative(document.createdAt, i18n.locale)}
          </span>
        )}
      </div>
    </li>
  );
};

const PendingProgress = ({ document }: { document: TDocumentMany }) => {
  const actionableRecipients = document.recipients.filter((recipient) => recipient.role !== RecipientRole.CC);

  const signedCount = actionableRecipients.filter(
    (recipient) => recipient.signingStatus === SigningStatus.SIGNED,
  ).length;

  const totalCount = actionableRecipients.length;

  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="inline-flex h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <span
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: totalCount > 0 ? `${(signedCount / totalCount) * 100}%` : '0%' }}
        />
      </span>

      <span>
        <Trans>
          {signedCount} of {totalCount} signed
        </Trans>
      </span>
    </span>
  );
};

const EXPIRY_WARNING_DAYS = 3;

const ExpiryBadge = ({ document }: { document: TDocumentMany }) => {
  const { i18n } = useLingui();

  const nextExpiry = document.recipients
    .filter((recipient) => recipient.signingStatus !== SigningStatus.SIGNED && recipient.expiresAt)
    .map((recipient) => DateTime.fromJSDate(new Date(recipient.expiresAt as Date)))
    .sort((a, b) => a.toMillis() - b.toMillis())[0];

  if (!nextExpiry) {
    return null;
  }

  const isWithinWarningWindow = nextExpiry.diffNow('days').days <= EXPIRY_WARNING_DAYS;

  if (!isWithinWarningWindow) {
    return null;
  }

  const expiresIn = nextExpiry.toRelative({ locale: i18n.locale });

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive-subtle px-2 py-0.5 font-medium text-destructive text-xs">
      <TimerIcon className="size-3" aria-hidden />
      <Trans>Expires {expiresIn}</Trans>
    </span>
  );
};

const formatRelative = (date: Date | string, locale: string) => {
  return DateTime.fromJSDate(new Date(date)).toRelative({ locale }) ?? '';
};
