import { cn } from '@documenso/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';

export type StatusIconTileProps = {
  tone: 'success' | 'muted';
  icon: LucideIcon;
  className?: string;
};

export const StatusIconTile = ({ tone, icon: Icon, className }: StatusIconTileProps) => {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-12 shrink-0 items-center justify-center rounded-full',
        tone === 'success' && 'bg-success-subtle text-success',
        tone === 'muted' && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon size={22} aria-hidden />
    </span>
  );
};
