import type { ImgHTMLAttributes } from 'react';

import { cn } from '@documenso/ui/lib/utils';

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

/**
 * Corteron crest icon (no wordmark).
 */
export const BrandingLogoIcon = ({ className, alt = 'Corteron', ...props }: LogoProps) => {
  return (
    <img
      src="/static/logo.png"
      alt={alt}
      className={cn('h-auto w-auto object-contain', className)}
      {...props}
    />
  );
};
