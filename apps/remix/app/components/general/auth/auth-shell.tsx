import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { AuthFooter } from '~/components/general/auth/auth-footer';
import { AuthShowcase } from '~/components/general/auth/auth-showcase';
import { AuthShowcasePeek } from '~/components/general/auth/auth-showcase-peek';
import { BrandLockup } from '~/components/general/auth/brand-lockup';

export type AuthShellProps = {
  action?: {
    prompt: ReactNode;
    label: ReactNode;
    to: string;
  };
  children: ReactNode;
};

export const AuthShell = ({ action, children }: AuthShellProps) => {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-envelope-editor-background text-foreground">
      <header className="hidden h-[88px] items-center justify-between px-12 xl:flex">
        <BrandLockup size="md" />

        {action && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{action.prompt}</span>

            <Link
              to={action.to}
              className="inline-flex h-10 items-center rounded-md border border-input bg-card px-4 font-medium ring-offset-envelope-editor-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {action.label}
            </Link>
          </div>
        )}
      </header>

      <div className="xl:hidden">
        <AuthShowcasePeek />
      </div>

      <main className="flex flex-1 flex-col justify-center px-4 pt-6 pb-2 md:items-center md:py-12 xl:flex-row xl:items-center xl:justify-center xl:gap-16 xl:px-12 xl:py-0">
        <section className="hidden min-w-0 flex-1 xl:block">
          <AuthShowcase />
        </section>

        <div className="flex w-full flex-col gap-8 md:w-[440px] md:shrink-0 md:rounded-lg md:bg-card md:p-10 md:shadow-auth-card">
          {children}
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};
