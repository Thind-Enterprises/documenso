import { cn } from '@documenso/ui/lib/utils';
import { useLingui } from '@lingui/react/macro';

import { CrestChip } from '~/components/general/auth/crest-chip';

export type BrandLockupProps = {
  size: 'md' | 'sm';
  className?: string;
};

export const BrandLockup = ({ size, className }: BrandLockupProps) => {
  const { t } = useLingui();

  const isMedium = size === 'md';

  return (
    <div
      role="img"
      aria-label={t`Corteron Sign`}
      className={cn('flex items-center', isMedium ? 'gap-3' : 'gap-2.5', className)}
    >
      <CrestChip size={isMedium ? 36 : 32} raised={isMedium} />

      <span
        aria-hidden
        className={cn('font-bold text-foreground tracking-[0.24em]', isMedium ? 'text-[15px]' : 'text-sm')}
      >
        CORTERON
      </span>

      <span aria-hidden className={cn('w-px bg-auth-rule', isMedium ? 'h-4' : 'h-3.5')} />

      <span aria-hidden className={cn('font-medium text-muted-foreground', isMedium ? 'text-[15px]' : 'text-sm')}>
        Sign
      </span>
    </div>
  );
};
