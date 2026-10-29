import { Button } from '@documenso/ui/primitives/button';
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { MailCheckIcon } from 'lucide-react';
import { Link } from 'react-router';

import { AuthShell } from '~/components/general/auth/auth-shell';
import { StatusIconTile } from '~/components/general/auth/status-icon-tile';
import { appMetaTags } from '~/utils/meta';

export const handle = { hasAuthShell: true };

export function meta() {
  return appMetaTags(msg`Forgot password`);
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      action={{
        prompt: <Trans>Remembered it?</Trans>,
        label: <Trans>Sign in</Trans>,
        to: '/signin',
      }}
    >
      <div className="flex flex-col gap-5">
        <StatusIconTile tone="success" icon={MailCheckIcon} />

        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-[32px] leading-10 tracking-[-0.02em]">
            <Trans>Check your email</Trans>
          </h1>

          <p className="text-[15px] text-muted-foreground leading-6">
            <Trans>If an account exists for that email, a reset link is on its way.</Trans>
          </p>
        </div>
      </div>

      <Button
        asChild
        variant="outline"
        className="h-12 w-full border-input bg-background font-medium text-[15px] hover:bg-accent"
      >
        <Link to="/signin">
          <Trans>Back to sign in</Trans>
        </Link>
      </Button>

      <p className="-mt-2 text-muted-foreground text-sm leading-[22px]">
        <Trans>
          Nothing after a few minutes? Check spam, or{' '}
          <Link
            to="/forgot-password"
            className="rounded-[2px] font-medium text-link underline underline-offset-[3px] ring-offset-background hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            send it again
          </Link>
        </Trans>
      </p>
    </AuthShell>
  );
}
