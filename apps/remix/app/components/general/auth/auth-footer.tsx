import { cn } from '@documenso/ui/lib/utils';
import { Trans } from '@lingui/react/macro';

import { PublicLegalLinks } from '~/components/general/public-legal-links';

export type AuthFooterProps = {
  className?: string;
};

export const AuthFooter = ({ className }: AuthFooterProps) => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'flex flex-col items-center px-4 pt-4 pb-5 text-[13px] text-muted-foreground leading-5 md:flex-row md:justify-between md:px-12 md:py-[18px]',
        className,
      )}
    >
      <p className="order-2 md:order-none">
        <Trans>© {year} Corteron</Trans>
      </p>

      <PublicLegalLinks className="order-1 gap-x-6 text-[13px] leading-5 md:order-none md:justify-end [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center md:[&_a]:min-h-6" />
    </footer>
  );
};
