import { isSigninEnabledForProvider } from '@documenso/lib/constants/auth';
import { Button } from '@documenso/ui/primitives/button';
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Link2OffIcon } from 'lucide-react';
import { Link, redirect } from 'react-router';

import { AuthShell } from '~/components/general/auth/auth-shell';
import { StatusIconTile } from '~/components/general/auth/status-icon-tile';
import { appMetaTags } from '~/utils/meta';

export const handle = { hasAuthShell: true };

export function meta() {
  return appMetaTags(msg`Reset Password`);
}

export async function loader() {
  if (!isSigninEnabledForProvider('email')) {
    throw redirect('/signin');
  }

  return null;
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      action={{
        prompt: <Trans>Remembered it?</Trans>,
        label: <Trans>Sign in</Trans>,
        to: '/signin',
      }}
    >
      <div className="flex flex-col gap-5">
        <StatusIconTile tone="muted" icon={Link2OffIcon} />

        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-[32px] leading-10 tracking-[-0.02em]">
            <Trans>Unable to reset password</Trans>
          </h1>

          <p className="text-[15px] text-muted-foreground leading-6">
            <Trans>
              The token you have used to reset your password is either expired or it never existed. If you have still
              forgotten your password, please request a new reset link.
            </Trans>
          </p>
        </div>
      </div>

      <Button asChild className="h-12 w-full font-semibold text-[15px] shadow-button-primary hover:bg-documenso-700">
        <Link to="/forgot-password">
          <Trans>Request a new link</Trans>
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        className="-mt-2 h-12 w-full border-input bg-background font-medium text-[15px] hover:bg-accent"
      >
        <Link to="/signin">
          <Trans>Return to sign in</Trans>
        </Link>
      </Button>
    </AuthShell>
  );
}
