import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { Plural, Trans } from '@lingui/react/macro';
import { RecipientRole } from '@prisma/client';
import { motion } from 'framer-motion';
import { ArrowDownIcon, CheckCircle2Icon } from 'lucide-react';

import { useRequiredEnvelopeSigningContext } from '../document-signing/envelope-signing-provider';
import { useGoToNextSigningField } from './use-go-to-next-signing-field';

export type EnvelopeSigningProgressProps = {
  variant: 'card' | 'compact' | 'bar';
  className?: string;
};

/**
 * Shows how many required fields the recipient has completed and offers a shortcut to the next one.
 *
 * - `card`: sidebar card with counts, progress bar and a "Go to next field" button.
 * - `compact`: inline header version with a short label, shown next to the complete button.
 * - `bar`: progress bar only, for the mobile widget.
 */
export const EnvelopeSigningProgress = ({ variant, className }: EnvelopeSigningProgressProps) => {
  const { recipient, requiredRecipientFields, recipientFieldsRemaining } = useRequiredEnvelopeSigningContext();

  const goToNextField = useGoToNextSigningField();

  const totalCount = requiredRecipientFields.length;
  const remainingCount = recipientFieldsRemaining.length;
  const completedCount = Math.max(totalCount - remainingCount, 0);
  const percentage = totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);
  const isDone = remainingCount === 0;

  // Viewers and assistants have no required fields of their own to track.
  const hasTrackableFields = recipient.role !== RecipientRole.VIEWER && recipient.role !== RecipientRole.ASSISTANT;

  if (!hasTrackableFields) {
    return null;
  }

  const progressBar = (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={totalCount}
      aria-valuenow={completedCount}
      className="relative h-1.5 overflow-hidden rounded-full bg-muted"
    >
      <motion.div
        className={cn('absolute inset-y-0 left-0 rounded-full', isDone ? 'bg-success' : 'bg-primary')}
        initial={false}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );

  if (variant === 'bar') {
    return <div className={className}>{progressBar}</div>;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex w-36 flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">
            <Plural one="1 Field Remaining" other="# Fields Remaining" value={remainingCount} />
          </span>
          {progressBar}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4',
        isDone ? 'border-success/30 bg-success-subtle' : 'border-border bg-auth-band/60',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">
            {isDone ? <Trans>Ready to finish</Trans> : <Trans>Your progress</Trans>}
          </span>

          <span className="text-muted-foreground text-xs">
            <Plural one="1 Field Remaining" other="# Fields Remaining" value={remainingCount} />
          </span>
        </div>

        {isDone ? (
          <CheckCircle2Icon className="size-5 shrink-0 text-success" aria-hidden />
        ) : (
          <span className="font-mono font-semibold text-auth-accent text-sm tabular-nums">{percentage}%</span>
        )}
      </div>

      {progressBar}

      {!isDone && (
        <Button type="button" variant="outline" size="sm" className="w-full bg-card" onClick={goToNextField}>
          <ArrowDownIcon className="mr-1.5 -ml-0.5 size-4" />
          <Trans>Go to next field</Trans>
        </Button>
      )}
    </div>
  );
};
