import { SUPPORT_EMAIL } from '@documenso/lib/constants/app';
import { isSigninEnabledForProvider } from '@documenso/lib/constants/auth';
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ArrowLeftIcon } from 'lucide-react';
import { Link, redirect } from 'react-router';

import { ForgotPasswordForm } from '~/components/forms/forgot-password';
import { AuthShell } from '~/components/general/auth/auth-shell';
import { appMetaTags } from '~/utils/meta';

export const handle = { hasAuthShell: true };

export function meta() {
  return appMetaTags(msg`Forgot Password`);
}

export async function loader() {
  if (!isSigninEnabledForProvider('email')) {
    throw redirect('/signin');
  }

  return null;
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
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-[32px] leading-10 tracking-[-0.02em]">
          <Trans>Reset your password</Trans>
        </h1>

        <p className="text-[15px] text-muted-foreground leading-6">
          <Trans>Enter your account email and we'll send you a link to set a new password.</Trans>
        </p>
      </div>

      <ForgotPasswordForm className="gap-y-5" />

      <div className="flex flex-col gap-4 border-border border-t pt-6">
        <p className="text-muted-foreground text-sm leading-[22px]">
          <Trans>
            No longer have access to this email?{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="rounded-[2px] font-medium text-link underline underline-offset-[3px] ring-offset-background hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Contact support
            </a>
          </Trans>
        </p>

        <Link
          to="/signin"
          className="inline-flex min-h-12 items-center gap-2 self-start rounded-[2px] font-medium text-[15px] text-link ring-offset-background hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeftIcon size={16} aria-hidden />
          <Trans>Back to sign in</Trans>
        </Link>
      </div>
    </AuthShell>
  );
}
