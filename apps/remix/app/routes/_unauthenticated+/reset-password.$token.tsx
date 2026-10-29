import { isSigninEnabledForProvider } from '@documenso/lib/constants/auth';
import { getResetTokenValidity } from '@documenso/lib/server-only/user/get-reset-token-validity';
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowLeftIcon } from 'lucide-react';
import { Link, redirect } from 'react-router';

import { ResetPasswordForm } from '~/components/forms/reset-password';
import { AuthShell } from '~/components/general/auth/auth-shell';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/reset-password.$token';

export const handle = { hasAuthShell: true };

export function meta() {
  return appMetaTags(msg`Reset Password`);
}

export async function loader({ params }: Route.LoaderArgs) {
  if (!isSigninEnabledForProvider('email')) {
    throw redirect('/signin');
  }

  const { token } = params;

  const isValid = await getResetTokenValidity({ token });

  if (!isValid) {
    throw redirect('/reset-password');
  }

  return {
    token,
  };
}

export default function ResetPasswordPage({ loaderData }: Route.ComponentProps) {
  const { token } = loaderData;

  return (
    <AuthShell
      action={{
        prompt: <Trans>Remembered it?</Trans>,
        label: <Trans>Sign in</Trans>,
        to: '/signin',
      }}
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-[32px] leading-10 tracking-[-0.02em]">
          <Trans>Set a new password</Trans>
        </h1>

        <p className="text-[15px] text-muted-foreground leading-6">
          <Trans>You'll use it the next time you sign in.</Trans>
        </p>
      </div>

      <ResetPasswordForm token={token} className="gap-y-5" />

      <Link
        to="/signin"
        className="-mt-2 inline-flex min-h-12 items-center gap-2 self-start rounded-[2px] font-medium text-[15px] text-link ring-offset-background hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon size={16} aria-hidden />
        <Trans>Back to sign in</Trans>
      </Link>

      <p className="text-center text-[15px] text-muted-foreground leading-6">
        <Trans>
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="rounded-[2px] font-medium text-link underline underline-offset-[3px] ring-offset-background hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign up
          </Link>
        </Trans>
      </p>
    </AuthShell>
  );
}
