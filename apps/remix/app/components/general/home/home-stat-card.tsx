import { cn } from '@documenso/ui/lib/utils';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRightIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

export type HomeStatCardProps = {
  to: string;
  icon: LucideIcon;
  label: ReactNode;
  value?: number;
  hint?: ReactNode;
  tone?: 'primary' | 'neutral';
  isLoading?: boolean;
};

export const HomeStatCard = ({
  to,
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
  isLoading = false,
}: HomeStatCardProps) => {
  const isPrimary = tone === 'primary';

  return (
    <Link
      to={to}
      className={cn(
        'group relative flex flex-col gap-4 rounded-lg p-5 shadow-auth-float ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isPrimary ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground hover:shadow-auth-card',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md',
            isPrimary ? 'bg-primary-foreground/15' : 'bg-auth-band text-auth-accent',
          )}
        >
          <Icon className="size-[18px]" />
        </span>

        <ArrowUpRightIcon
          aria-hidden
          className={cn(
            'size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
            isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground',
          )}
        />
      </div>

      <div className="flex flex-col gap-1">
        {isLoading || value === undefined ? (
          <Skeleton className={cn('h-8 w-12', isPrimary && 'bg-primary-foreground/20')} />
        ) : (
          <span className="font-semibold text-3xl tabular-nums leading-8">{value.toLocaleString()}</span>
        )}

        <span className={cn('font-medium text-sm', isPrimary ? 'text-primary-foreground' : 'text-foreground')}>
          {label}
        </span>

        {hint && (
          <span className={cn('text-xs', isPrimary ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
            {hint}
          </span>
        )}
      </div>
    </Link>
  );
};
