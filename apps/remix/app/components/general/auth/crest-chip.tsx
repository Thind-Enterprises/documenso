import { cn } from '@documenso/ui/lib/utils';
import type { ReactNode } from 'react';

import { BrandingLogoIcon } from '~/components/general/branding-logo-icon';

export type CrestChipProps = {
  size: 32 | 36 | 40;
  raised?: boolean;
  className?: string;
  children?: ReactNode;
};

const CREST_SIZE_BY_CHIP_SIZE = {
  32: 22,
  36: 26,
  40: 26,
} as const;

export const CrestChip = ({ size, raised = false, className, children }: CrestChipProps) => {
  const crestSize = CREST_SIZE_BY_CHIP_SIZE[size];

  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-lg', className)}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(160deg, var(--documenso-900) 0%, var(--documenso-950) 100%)',
        boxShadow: raised
          ? 'inset 0 0 0 1px rgb(165 180 252 / 0.24), 0 1px 2px rgb(0 0 0 / 0.3)'
          : 'inset 0 0 0 1px rgb(165 180 252 / 0.24)',
      }}
    >
      {children ?? <BrandingLogoIcon alt="" aria-hidden style={{ width: crestSize, height: crestSize }} />}
    </span>
  );
};
