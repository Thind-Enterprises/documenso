import { mapSecondaryIdToDocumentId } from '@documenso/lib/utils/envelope';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';
import { Separator } from '@documenso/ui/primitives/separator';
import { Trans } from '@lingui/react/macro';
import { EnvelopeType, RecipientRole } from '@prisma/client';
import { BanIcon, DownloadCloudIcon, SparklesIcon } from 'lucide-react';
import { Link } from 'react-router';
import { match } from 'ts-pattern';

import { EnvelopeDownloadDialog } from '~/components/dialogs/envelope-download-dialog';
import { useEmbedSigningContext } from '~/components/embed/embed-signing-context';
import { BrandLockup } from '~/components/general/auth/brand-lockup';
import { CrestChip } from '~/components/general/auth/crest-chip';
import { PublicLegalLinksDropdownMenuItems } from '~/components/general/public-legal-links';

import { DocumentSigningRejectDialog } from '../document-signing/document-signing-reject-dialog';
import { useRequiredEnvelopeSigningContext } from '../document-signing/envelope-signing-provider';
import { EnvelopeSigningAiSummarySheet } from './envelope-signing-ai-summary-sheet';
import { EnvelopeSignerCompleteDialog } from './envelope-signing-complete-dialog';
import { EnvelopeSigningProgress } from './envelope-signing-progress';

export type EnvelopeSignerHeaderProps = {
  isAiSummaryEnabled?: boolean;
};

export const EnvelopeSignerHeader = ({ isAiSummaryEnabled = false }: EnvelopeSignerHeaderProps) => {
  const { envelopeData, envelope, recipient } = useRequiredEnvelopeSigningContext();

  const isEmbedSigning = useEmbedSigningContext() !== null;
  const hasCustomBrandingLogo = envelopeData.settings.brandingEnabled && Boolean(envelopeData.settings.brandingLogo);

  return (
    <nav className="embed--DocumentWidgetHeader flex h-16 max-w-screen flex-row items-center justify-between border-border border-b bg-background px-4 md:px-6">
      {/* Left side - Logo and title */}
      <div className="flex min-w-0 flex-1 items-center space-x-2 md:w-auto md:flex-none">
        {!isEmbedSigning &&
          (hasCustomBrandingLogo ? (
            <img
              src={`/api/branding/logo/team/${envelope.teamId}`}
              alt={`${envelope.team.name}'s Logo`}
              className="h-6 w-auto flex-shrink-0"
            />
          ) : (
            <Link
              to="/"
              className="flex-shrink-0 rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <BrandLockup size="sm" className="hidden md:flex" />
              <CrestChip size={32} className="md:hidden" />
            </Link>
          ))}

        <h1 title={envelope.title} className="min-w-0 truncate pl-1 font-semibold text-base text-foreground md:hidden">
          {envelope.title}
        </h1>

        {!isEmbedSigning && <Separator orientation="vertical" className="!mx-4 hidden h-6 md:block" />}

        <div className="hidden min-w-0 items-center space-x-2 md:flex">
          <h1 title={envelope.title} className="truncate font-medium text-foreground text-sm lg:max-w-[28rem]">
            {envelope.title}
          </h1>

          <Badge variant="secondary" size="small" className="shrink-0">
            {match(recipient.role)
              .with(RecipientRole.VIEWER, () => <Trans>Viewer</Trans>)
              .with(RecipientRole.SIGNER, () => <Trans>Signer</Trans>)
              .with(RecipientRole.APPROVER, () => <Trans>Approver</Trans>)
              .with(RecipientRole.ASSISTANT, () => <Trans>Assistant</Trans>)
              .otherwise(() => null)}
          </Badge>
        </div>
      </div>

      {/* Right side - Desktop content */}
      <div className="hidden items-center gap-3 lg:flex">
        <EnvelopeSigningProgress variant="compact" />

        <EnvelopeSignerCompleteDialog />
      </div>

      {/* Mobile Actions button */}
      <div className="flex-shrink-0 lg:hidden">
        <MobileDropdownMenu isAiSummaryEnabled={isAiSummaryEnabled} />
      </div>
    </nav>
  );
};

const MobileDropdownMenu = ({ isAiSummaryEnabled }: { isAiSummaryEnabled: boolean }) => {
  const { envelope, recipient } = useRequiredEnvelopeSigningContext();

  const embedSigningContext = useEmbedSigningContext();

  const isEmbedSigning = embedSigningContext !== null;
  const { allowDocumentRejection } = embedSigningContext || {};

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Trans>Actions</Trans>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {isAiSummaryEnabled && (
          <EnvelopeSigningAiSummarySheet
            trigger={
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <div>
                  <SparklesIcon className="mr-2 h-4 w-4" />
                  <Trans>Summarize with AI</Trans>
                </div>
              </DropdownMenuItem>
            }
          />
        )}

        <EnvelopeDownloadDialog
          envelopeId={envelope.id}
          envelopeStatus={envelope.status}
          envelopeItems={envelope.envelopeItems}
          token={recipient.token}
          trigger={
            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
              <div>
                <DownloadCloudIcon className="mr-2 h-4 w-4" />
                <Trans>Download PDF</Trans>
              </div>
            </DropdownMenuItem>
          }
        />

        {envelope.type === EnvelopeType.DOCUMENT && allowDocumentRejection !== false && (
          <DocumentSigningRejectDialog
            documentId={mapSecondaryIdToDocumentId(envelope.secondaryId)}
            token={recipient.token}
            trigger={
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <div>
                  <BanIcon className="mr-2 h-4 w-4" />
                  <Trans>Reject</Trans>
                </div>
              </DropdownMenuItem>
            }
          />
        )}

        {!isEmbedSigning && <PublicLegalLinksDropdownMenuItems />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
