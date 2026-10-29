import { authClient } from '@documenso/auth/client';
import { getOptionalSession } from '@documenso/auth/server/lib/utils/get-session';
import {
  IS_GOOGLE_SSO_ENABLED,
  IS_MICROSOFT_SSO_ENABLED,
  IS_OIDC_AUTO_REDIRECT_DISABLED,
  IS_OIDC_SSO_ENABLED,
  isSigninEnabledForProvider,
  isSignupEnabledForProvider,
  OIDC_PROVIDER_LABEL,
} from '@documenso/lib/constants/auth';
import { isValidReturnTo, normalizeReturnTo } from '@documenso/lib/utils/is-valid-return-to';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { Link, redirect, useSearchParams } from 'react-router';

import { SignInForm } from '~/components/forms/signin';
import { SIGNUP_ERROR_MESSAGES } from '~/components/forms/signup';
import { AuthShell } from '~/components/general/auth/auth-shell';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/signin';

export const handle = { hasAuthShell: true };

export function meta() {
  return appMetaTags(msg`Sign In`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const { session } = await getOptionalSession(request);

  // Embed sessions are rejected by the authenticated tree, so treat them as signed out here.
  const isAuthenticated = session !== null && !session.isEmbed;

  // SSR env variables.
  const isEmailPasswordSigninEnabled = isSigninEnabledForProvider('email');
  const isGoogleSSOEnabled = IS_GOOGLE_SSO_ENABLED && isSigninEnabledForProvider('google');
  const isMicrosoftSSOEnabled = IS_MICROSOFT_SSO_ENABLED && isSigninEnabledForProvider('microsoft');
  const isOIDCSSOEnabled = IS_OIDC_SSO_ENABLED && isSigninEnabledForProvider('oidc');

  // Automatically redirect to OIDC when it is the only enabled signin transport,
  // unless the redirect has been explicitly disabled via env.
  const isOIDCOnlyTransport =
    isOIDCSSOEnabled && !isEmailPasswordSigninEnabled && !isGoogleSSOEnabled && !isMicrosoftSSOEnabled;

  const shouldAutoRedirectToOIDC = isOIDCOnlyTransport && !IS_OIDC_AUTO_REDIRECT_DISABLED;

  const oidcProviderLabel = OIDC_PROVIDER_LABEL;

  const isSignupEnabled =
    isSignupEnabledForProvider('email') ||
    (IS_GOOGLE_SSO_ENABLED && isSignupEnabledForProvider('google')) ||
    (IS_MICROSOFT_SSO_ENABLED && isSignupEnabledForProvider('microsoft')) ||
    (IS_OIDC_SSO_ENABLED && isSignupEnabledForProvider('oidc'));

  let returnTo = new URL(request.url).searchParams.get('returnTo') ?? undefined;

  returnTo = isValidReturnTo(returnTo) ? normalizeReturnTo(returnTo) : undefined;

  if (isAuthenticated) {
    throw redirect(returnTo || '/');
  }

  return {
    isEmailPasswordSigninEnabled,
    isGoogleSSOEnabled,
    isMicrosoftSSOEnabled,
    isOIDCSSOEnabled,
    isSignupEnabled,
    oidcProviderLabel,
    returnTo,
    shouldAutoRedirectToOIDC,
  };
}

export default function SignIn({ loaderData }: Route.ComponentProps) {
  const {
    isEmailPasswordSigninEnabled,
    isGoogleSSOEnabled,
    isMicrosoftSSOEnabled,
    isOIDCSSOEnabled,
    isSignupEnabled,
    oidcProviderLabel,
    returnTo,
    shouldAutoRedirectToOIDC,
  } = loaderData;

  const { _ } = useLingui();

  const [searchParams] = useSearchParams();

  const errorParam = searchParams.get('error');
  const signupError = errorParam ? SIGNUP_ERROR_MESSAGES[errorParam] : undefined;

  useEffect(() => {
    if (!shouldAutoRedirectToOIDC) {
      return;
    }

    void authClient.oidc.signIn({ redirectPath: returnTo ?? '/' });
  }, [shouldAutoRedirectToOIDC, returnTo]);

  if (shouldAutoRedirectToOIDC) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center justify-center gap-y-4 py-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            <Trans>Redirecting to {oidcProviderLabel || 'OIDC'}...</Trans>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      action={
        isSignupEnabled
          ? {
              prompt: <Trans>New to Corteron Sign?</Trans>,
              label: <Trans>Create account</Trans>,
              to: returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : '/signup',
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-8">
        {signupError && (
          <Alert
            variant="destructive"
            className="rounded-lg border border-destructive-border bg-destructive-subtle px-4 py-3 text-foreground"
          >
            <AlertDescription>{_(signupError)}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-[32px] leading-10 tracking-[-0.02em]">
            <Trans>Sign in</Trans>
          </h1>

          <p className="text-[15px] text-muted-foreground leading-6">
            <Trans>Welcome back to Corteron Sign.</Trans>
          </p>
        </div>

        <SignInForm
          isEmailPasswordSigninEnabled={isEmailPasswordSigninEnabled}
          isGoogleSSOEnabled={isGoogleSSOEnabled}
          isMicrosoftSSOEnabled={isMicrosoftSSOEnabled}
          isOIDCSSOEnabled={isOIDCSSOEnabled}
          oidcProviderLabel={oidcProviderLabel}
          returnTo={returnTo}
        />

        {isSignupEnabled && (
          <p className="text-center text-[15px] text-muted-foreground leading-6 xl:hidden">
            <Trans>
              New to Corteron Sign?{' '}
              <Link
                to={returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : '/signup'}
                className="rounded-[2px] font-medium text-link underline underline-offset-[3px] ring-offset-background hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Create an account
              </Link>
            </Trans>
          </p>
        )}
      </div>
    </AuthShell>
  );
}
