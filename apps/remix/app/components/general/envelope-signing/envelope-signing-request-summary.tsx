import { cn } from '@documenso/ui/lib/utils';
import { Trans, useLingui } from '@lingui/react/macro';
import { RecipientRole } from '@prisma/client';
import { CalendarClockIcon } from 'lucide-react';
import { DateTime } from 'luxon';
import { match } from 'ts-pattern';

import { useRequiredEnvelopeSigningContext } from '../document-signing/envelope-signing-provider';

export type EnvelopeSigningRequestSummaryProps = {
  className?: string;
};

/**
 * Who sent the document, what they are asking the recipient to do, and when the signing link expires.
 */
export const EnvelopeSigningRequestSummary = ({ className }: EnvelopeSigningRequestSummaryProps) => {
  const { i18n } = useLingui();
  const { envelopeData, envelope, recipient } = useRequiredEnvelopeSigningContext();

  const senderName = envelopeData.sender.name || envelope.team.name;
  const senderEmail = envelopeData.sender.email;

  const initials = senderName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const expiresAt = recipient.expiresAt ? DateTime.fromJSDate(new Date(recipient.expiresAt)) : null;
  const expiresOn = expiresAt?.setLocale(i18n.locale).toLocaleString(DateTime.DATE_MED);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-auth-band font-semibold text-auth-accent text-xs"
        >
          {initials || '?'}
        </span>

        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground text-sm">{senderName}</span>
          {senderEmail && <span className="truncate text-muted-foreground text-xs">{senderEmail}</span>}
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        {match(recipient.role)
          .with(RecipientRole.SIGNER, () => <Trans>Requested your signature on this document.</Trans>)
          .with(RecipientRole.APPROVER, () => <Trans>Requested your approval on this document.</Trans>)
          .with(RecipientRole.VIEWER, () => <Trans>Shared this document for you to review.</Trans>)
          .with(RecipientRole.ASSISTANT, () => <Trans>Asked you to help fill in this document.</Trans>)
          .otherwise(() => null)}
      </p>

      {expiresOn && (
        <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <CalendarClockIcon className="size-3.5" aria-hidden />
          <Trans>This link expires on {expiresOn}</Trans>
        </p>
      )}
    </div>
  );
};
