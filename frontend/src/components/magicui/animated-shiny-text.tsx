'use client';

import { CSSProperties, FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedShinyTextProps {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
}

/** AnimatedShinyText (Magic UI, adapted). Subtle traveling sheen over text. */
export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
}) => {
  return (
    <span
      style={
        {
          '--shiny-width': `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        'mx-auto max-w-md text-slate-500',
        'animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%]',
        'bg-gradient-to-r from-transparent via-slate-100/90 via-50% to-transparent',
        className
      )}
    >
      {children}
    </span>
  );
};
