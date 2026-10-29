import { Trans, useLingui } from '@lingui/react/macro';
import { CheckIcon } from 'lucide-react';

import { AUTH_SPILL_STYLE, SignatureMark } from '~/components/general/auth/auth-showcase';
import { BrandLockup } from '~/components/general/auth/brand-lockup';

export const AuthShowcasePeek = () => {
  const { t } = useLingui();

  return (
    <div
      role="img"
      aria-label={t`Corteron Sign. Example of a sealed agreement.`}
      className="relative h-[184px] overflow-hidden border-border border-b bg-auth-band"
    >
      <div className="relative mx-auto h-full w-full max-w-[390px]">
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 left-[120px] size-80"
          style={AUTH_SPILL_STYLE}
        />

        <div aria-hidden className="relative flex h-16 items-center px-4">
          <BrandLockup size="sm" />
        </div>

        <div
          aria-hidden
          className="absolute top-16 left-[152px] flex h-[200px] w-[222px] flex-col gap-1.5 rounded-[3px] bg-white p-3.5 text-slate-900 shadow-paper"
        >
          <span className="font-mono text-[6.5px] text-slate-500 leading-[9px]">CS-7F3K-29QD</span>

          <p className="font-semibold text-[10.5px] leading-[14px]">
            <Trans>Mutual Non-Disclosure Agreement</Trans>
          </p>

          <p className="text-[7px] text-slate-600 leading-[10px]">
            <Trans>
              Any non-public business, technical or financial information shared by either party is confidential.
            </Trans>
          </p>

          <div className="relative mt-1 flex h-9 items-center rounded-[3px] border-[1.5px] border-primary bg-primary/[0.06] px-2">
            <span className="absolute -top-2 right-1.5 rounded-[3px] bg-primary px-[5px] font-semibold text-[7px] text-white leading-3">
              <Trans>Signature</Trans>
            </span>

            <SignatureMark name="Priya Nair" size={21} animate />
          </div>
        </div>

        <div
          aria-hidden
          className="absolute top-[76px] left-4 flex w-[152px] flex-col gap-2 rounded-lg bg-card px-3 py-2.5 shadow-auth-float motion-safe:animate-float-slow"
        >
          <div className="flex gap-[3px]">
            <span className="h-1 flex-1 rounded-[2px] bg-auth-step-line" />
            <span className="h-1 flex-1 rounded-[2px] bg-auth-step-line" />
            <span className="h-1 flex-1 rounded-[2px] bg-auth-step-line" />
            <span className="h-1 flex-1 rounded-[2px] bg-primary" />
          </div>

          <div className="flex items-center gap-1 text-xs leading-4">
            <CheckIcon size={12} strokeWidth={2.5} className="text-auth-accent" aria-hidden />
            <span className="font-semibold text-auth-accent">
              <Trans>Sealed</Trans>
            </span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">09:33</span>
          </div>
        </div>
      </div>
    </div>
  );
};
