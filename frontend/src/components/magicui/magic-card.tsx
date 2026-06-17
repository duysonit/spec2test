'use client';

import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  /** Spotlight radius in px */
  gradientSize?: number;
  /** Spotlight color (rgb/hex/hsl) */
  gradientColor?: string;
  /** Spotlight opacity 0..1 */
  gradientOpacity?: number;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  role?: string;
  tabIndex?: number;
  title?: string;
}

/**
 * MagicCard (Magic UI, adapted). A surface with a cursor-following spotlight.
 * Color comes from the locked accent so it never introduces a second accent.
 */
export function MagicCard({
  children,
  className,
  gradientSize = 240,
  gradientColor = 'rgb(38 129 255 / 0.16)', // HSC brand-blue tint
  gradientOpacity = 1,
  ...rest
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize * 2);
  const mouseY = useMotionValue(-gradientSize * 2);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el) return;
      const { left, top } = el.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-gradientSize * 2);
    mouseY.set(-gradientSize * 2);
  }, [mouseX, mouseY, gradientSize]);

  useEffect(() => {
    mouseX.set(-gradientSize * 2);
    mouseY.set(-gradientSize * 2);
  }, [mouseX, mouseY, gradientSize]);

  const background = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('group relative overflow-hidden', className)}
      {...rest}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background, opacity: gradientOpacity }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
