'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * ShimmerButton (Magic UI, adapted). A primary CTA with a traveling shine.
 * Defaults use the locked accent so it stays on-palette.
 */
export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = 'rgba(255,255,255,0.9)',
      shimmerSize = '0.05em',
      shimmerDuration = '2.6s',
      borderRadius = '0.5rem',
      background = 'rgb(38 129 255)', // HSC --brand #2681FF
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
          } as React.CSSProperties
        }
        className={cn(
          'group relative z-0 flex cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap border border-white/10 px-4 py-2.5 text-sm font-semibold text-white [background:var(--bg)] [border-radius:var(--radius)]',
          'transform-gpu transition-transform duration-300 active:translate-y-px',
          'focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        {...props}
      >
        {/* spark container */}
        <div
          className={cn(
            '-z-30 blur-[2px]',
            'absolute inset-0 overflow-visible [container-type:size]'
          )}
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="absolute -inset-full w-auto rotate-0 animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>

        {children}

        {/* highlight */}
        <div
          className={cn(
            'insert-0 absolute size-full',
            'rounded-[inherit] px-4 py-2.5 text-sm font-semibold',
            'shadow-[inset_0_-8px_10px_rgba(255,255,255,0.12)]',
            'transform-gpu transition-all duration-300 ease-in-out',
            'group-hover:shadow-[inset_0_-6px_10px_rgba(255,255,255,0.25)]',
            'group-active:shadow-[inset_0_-10px_10px_rgba(255,255,255,0.25)]'
          )}
        />

        {/* backdrop */}
        <div
          className={cn(
            'absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]'
          )}
        />
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
