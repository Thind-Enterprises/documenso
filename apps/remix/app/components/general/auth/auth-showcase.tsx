import { cn } from '@documenso/ui/lib/utils';
import { Trans, useLingui } from '@lingui/react/macro';
import { CheckIcon, ShieldCheckIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

export type AuthShowcaseProps = {
  className?: string;
};

export const AuthShowcase = ({ className }: AuthShowcaseProps) => {
  const { t } = useLingui();

  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <div
        role="img"
        aria-label={t`Example: a mutual NDA signed by Priya Nair, sealed, with its status and audit log`}
        className="relative h-[616px] w-[720px] shrink-0 origin-center xl:scale-[0.94] min-[1440px]:scale-100"
      >
        <div aria-hidden className="absolute inset-0">
          <div className="pointer-events-none absolute -top-5 left-5 size-[640px]" style={AUTH_SPILL_STYLE} />

          <ContractPaper>
            <div className="flex items-start justify-between gap-4 text-[8.5px] text-slate-500 leading-3">
              <span className="font-bold tracking-[0.14em]">NORTHWIND LTD</span>
              <span className="font-mono tabular-nums">CS-7F3K-29QD</span>
            </div>

            <p className="mt-5 font-semibold text-[17px] leading-[22px] tracking-[-0.01em]">
              <Trans>Mutual Non-Disclosure Agreement</Trans>
            </p>

            <p className="mt-1 text-[9.5px] text-slate-600 leading-[14px]">
              <Trans>Between Northwind Ltd and Priya Nair · 23 October 2026</Trans>
            </p>

            <div className="mt-[18px] h-px bg-slate-200" />

            <div className="mt-4 flex flex-col gap-3">
              <PaperClause title={<Trans>1. Confidential information</Trans>}>
                <Trans>
                  Any non-public business, technical or financial information shared by either party, in any form, is
                  confidential.
                </Trans>
              </PaperClause>

              <PaperClause title={<Trans>2. Use and protection</Trans>}>
                <Trans>
                  The recipient will use confidential information only to evaluate the proposed partnership and will
                  protect it with reasonable care.
                </Trans>
              </PaperClause>

              <PaperClause title={<Trans>3. Term</Trans>}>
                <Trans>
                  These obligations last for two years from the date of the last signature on this agreement.
                </Trans>
              </PaperClause>
            </div>

            <div className="mt-auto grid grid-cols-2 items-end gap-5">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[7.5px] text-slate-500 leading-[10px] tracking-[0.1em]">
                  <Trans>DISCLOSER</Trans>
                </span>

                <div className="border-slate-300 border-b">
                  <span className="whitespace-nowrap font-medium font-signature text-[26px] text-slate-700 leading-10">
                    A. Mehta
                  </span>
                </div>

                <span className="text-[8.5px] text-slate-500 leading-3">
                  <Trans>Arjun Mehta, Northwind Ltd</Trans>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[7.5px] text-slate-500 leading-[10px] tracking-[0.1em]">
                  <Trans>RECIPIENT</Trans>
                </span>

                <div className="relative flex h-11 items-center rounded-sm border-[1.5px] border-primary bg-primary/[0.06] px-2.5">
                  <span className="absolute -top-[9px] right-2 rounded-[3px] bg-primary px-1.5 font-semibold text-[8px] text-white leading-[14px]">
                    <Trans>Signature</Trans>
                  </span>

                  <SignatureMark name="Priya Nair" size={30} animate />
                </div>

                <span className="text-[8.5px] text-slate-500 leading-3">
                  <Trans>Priya Nair · 23 Oct 2026, 09:33</Trans>
                </span>
              </div>
            </div>
          </ContractPaper>

          <SealStamp title={<Trans>SEALED</Trans>} caption={<Trans>Verified · 23 Oct 2026 · 09:33</Trans>} />

          <StatusTimeline
            title={<Trans>Mutual NDA</Trans>}
            subtitle={<Trans>2 recipients</Trans>}
            badge={<Trans>Completed</Trans>}
            steps={[
              { label: <Trans>Sent</Trans>, meta: '09:14' },
              { label: <Trans>Viewed</Trans>, meta: '09:31' },
              { label: <Trans>Signed</Trans>, meta: '2 / 2' },
              { label: <Trans>Sealed</Trans>, meta: '09:33', current: true },
            ]}
          />

          <AuditStrip
            title={<Trans>Audit log</Trans>}
            zone="IST"
            entries={[
              { time: '09:31:48', event: <Trans>Opened by Priya Nair</Trans> },
              { time: '09:33:10', event: <Trans>Signed by Priya Nair</Trans> },
              { time: '09:33:12', event: <Trans>Sealed, signing certificate added</Trans> },
            ]}
          />
        </div>
      </div>

      <p className="flex items-center gap-3 text-muted-foreground text-sm">
        <Trans>Every completed document gets a signing certificate and an audit log.</Trans>
      </p>
    </div>
  );
};

export type ContractPaperProps = {
  children: ReactNode;
};

export const ContractPaper = ({ children }: ContractPaperProps) => {
  return (
    <div className="absolute top-0 left-[120px] flex h-[520px] w-[400px] flex-col rounded-[3px] bg-white px-7 pt-8 pb-7 text-slate-900 shadow-paper">
      {children}
    </div>
  );
};

type PaperClauseProps = {
  title: ReactNode;
  children: ReactNode;
};

const PaperClause = ({ title, children }: PaperClauseProps) => {
  return (
    <div>
      <p className="mb-[3px] font-semibold text-[9.5px] leading-[13px]">{title}</p>
      <p className="text-[8.5px] text-slate-600 leading-[13px]">{children}</p>
    </div>
  );
};

export type SignatureMarkProps = {
  name: string;
  size: number;
  animate?: boolean;
};

export const SignatureMark = ({ name, size, animate = false }: SignatureMarkProps) => {
  return (
    <span
      className={cn(
        'whitespace-nowrap font-semibold font-signature text-documenso-950 leading-none',
        animate && 'motion-safe:animate-signature-reveal',
      )}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
};

export type SealStampProps = {
  title: ReactNode;
  caption: ReactNode;
};

export const SealStamp = ({ title, caption }: SealStampProps) => {
  return (
    <div
      className="absolute top-[262px] left-[292px] flex -rotate-[9deg] flex-col gap-0.5 rounded-md border-2 bg-white/55 px-3 py-2 text-documenso-700"
      style={{
        borderColor: 'rgb(67 56 202 / 0.85)',
        boxShadow: 'inset 0 0 0 2px #FFFFFF, inset 0 0 0 3px rgb(67 56 202 / 0.45)',
      }}
    >
      <span className="flex items-center gap-1.5 font-bold text-[13px] leading-4 tracking-[0.22em]">
        <ShieldCheckIcon size={14} strokeWidth={2.5} aria-hidden />
        {title}
      </span>

      <span className="font-semibold text-[8.5px] leading-3 tracking-[0.04em]">{caption}</span>
    </div>
  );
};

export type StatusTimelineProps = {
  title: ReactNode;
  subtitle: ReactNode;
  badge: ReactNode;
  steps: { label: ReactNode; meta: string; current?: boolean }[];
};

export const StatusTimeline = ({ title, subtitle, badge, steps }: StatusTimelineProps) => {
  return (
    <div className="absolute top-14 left-[476px] flex w-[244px] flex-col gap-3 rounded-lg bg-card p-4 shadow-auth-float motion-safe:animate-float-slow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-semibold text-[13px] leading-5">{title}</span>
          <span className="text-muted-foreground text-xs leading-4">{subtitle}</span>
        </div>

        <span className="rounded-full bg-success-subtle px-2 py-0.5 font-semibold text-[11px] text-success leading-4">
          {badge}
        </span>
      </div>

      <ol className="relative flex flex-col gap-0.5">
        <span aria-hidden className="absolute top-4 bottom-4 left-4 w-0.5 bg-auth-step-line" />

        {steps.map((step, index) => (
          <li
            key={index}
            className={cn(
              'relative flex items-center gap-2.5 rounded-md px-2 py-[7px]',
              step.current && 'bg-auth-step-current',
            )}
          >
            <span
              className={cn(
                'relative inline-flex size-[18px] shrink-0 items-center justify-center rounded-full',
                step.current
                  ? 'bg-primary text-white shadow-[0_0_0_4px_hsl(var(--auth-step-ring))]'
                  : 'bg-auth-step-dot text-auth-accent',
              )}
            >
              <CheckIcon size={10} strokeWidth={3.5} aria-hidden />
            </span>

            <span className={cn('text-[13px] leading-[18px]', step.current && 'font-semibold')}>{step.label}</span>

            <span
              className={cn(
                'ml-auto font-mono text-[11px] text-muted-foreground tabular-nums',
                step.current && 'text-auth-accent',
              )}
            >
              {step.meta}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export type AuditStripProps = {
  title: ReactNode;
  zone: string;
  entries: { time: string; event: ReactNode }[];
};

export const AuditStrip = ({ title, zone, entries }: AuditStripProps) => {
  return (
    <div className="absolute top-[480px] left-0 flex w-[420px] flex-col gap-2 rounded-lg bg-card px-4 py-3.5 shadow-auth-float motion-safe:animate-float-slower">
      <div className="flex items-center justify-between font-semibold text-muted-foreground text-xs">
        <span>{title}</span>
        <span className="font-mono font-normal tabular-nums">{zone}</span>
      </div>

      {entries.map((entry, index) => (
        <div key={index} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 text-xs leading-[18px]">
          <span className="font-mono text-[11.5px] text-muted-foreground tabular-nums">{entry.time}</span>
          <span>{entry.event}</span>
        </div>
      ))}
    </div>
  );
};

export const AUTH_SPILL_STYLE: CSSProperties = {
  background: 'radial-gradient(closest-side, hsl(var(--auth-spill)), transparent)',
};
