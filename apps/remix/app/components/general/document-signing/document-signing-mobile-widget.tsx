import { Button } from '@documenso/ui/primitives/button';

import { Plural, Trans } from '@lingui/react/macro';
import { RecipientRole } from '@prisma/client';
import { LucideChevronDown, LucideChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { match } from 'ts-pattern';

import { useEmbedSigningContext } from '~/components/embed/embed-signing-context';

import { BrandingLogo } from '../branding-logo';
import EnvelopeSignerForm from '../envelope-signing/envelope-signer-form';
import { EnvelopeSignerCompleteDialog } from '../envelope-signing/envelope-signing-complete-dialog';
import { EnvelopeSigningProgress } from '../envelope-signing/envelope-signing-progress';
import { useRequiredEnvelopeSigningContext } from './envelope-signing-provider';

export const DocumentSigningMobileWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { hidePoweredBy = true } = useEmbedSigningContext() || {};

  const { recipientFieldsRemaining, recipient } = useRequiredEnvelopeSigningContext();

  /**
   * Pre open the widget for assistants to let them know it's there.
   */
  useEffect(() => {
    if (recipient.role === RecipientRole.ASSISTANT) {
      setIsExpanded(true);
    }
  }, []);

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-50 flex justify-center px-2 pb-2 sm:px-4 sm:pb-6">
      <div className="pointer-events-auto w-full max-w-[760px]">
        <div className="overflow-hidden rounded-xl bg-card shadow-dialog">
          {/* Main Header Bar */}
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {recipient.role !== RecipientRole.VIEWER && (
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex h-8 w-8 items-center justify-center"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <LucideChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <LucideChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                  </Button>
                )}

                <div>
                  <h2 className="font-semibold text-base text-foreground">
                    {match(recipient.role)
                      .with(RecipientRole.VIEWER, () => <Trans>View Document</Trans>)
                      .with(RecipientRole.SIGNER, () => <Trans>Sign Document</Trans>)
                      .with(RecipientRole.APPROVER, () => <Trans>Approve Document</Trans>)
                      .with(RecipientRole.ASSISTANT, () => <Trans>Assist Document</Trans>)
                      .otherwise(() => null)}
                  </h2>

                  <p className="-mt-0.5 text-muted-foreground text-sm">
                    {recipientFieldsRemaining.length === 0 ? (
                      match(recipient.role)
                        .with(RecipientRole.VIEWER, () => <Trans>Please mark as viewed to complete</Trans>)
                        .with(RecipientRole.SIGNER, () => <Trans>Please complete the document once reviewed</Trans>)
                        .with(RecipientRole.APPROVER, () => <Trans>Please complete the document once reviewed</Trans>)
                        .with(RecipientRole.ASSISTANT, () => <Trans>Please complete the document once reviewed</Trans>)
                        .otherwise(() => null)
                    ) : (
                      <Plural
                        value={recipientFieldsRemaining.length}
                        one="1 Field Remaining"
                        other="# Fields Remaining"
                      />
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <EnvelopeSignerCompleteDialog />
            </div>
          </div>

          {/* Progress Bar */}
          <EnvelopeSigningProgress variant="bar" className="px-4 pb-3" />

          {/* Expandable Content */}
          {isExpanded && (
            <div className="slide-in-from-bottom-2 animate-in border-border border-t p-4 duration-200">
              <EnvelopeSignerForm />

              {!hidePoweredBy && (
                <div className="mt-2 inline-block rounded bg-primary px-2 py-1 font-medium text-primary-foreground text-xs opacity-60 hover:opacity-100 lg:hidden">
                  <span>
                    <Trans>Powered by</Trans>
                  </span>
                  <BrandingLogo className="ml-2 inline-block h-[14px]" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
