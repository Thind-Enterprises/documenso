import type { HTMLAttributes } from 'react';

import { cn } from '@documenso/ui/lib/utils';

export type LogoProps = HTMLAttributes<HTMLSpanElement>;

/**
 * Corteron wordmark: crest icon + brand name.
 * Accepts height utilities via `className` (e.g. `h-6 w-auto`).
 */
export const BrandingLogo = ({ className, ...props }: LogoProps) => {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} {...props}>
      <img src="/static/logo.png" alt="" className="h-full w-auto object-contain" aria-hidden />
      <span className="text-[0.9em] font-bold tracking-[0.14em] leading-none">CORTERON</span>
    </span>
  );
};
