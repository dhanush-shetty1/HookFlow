import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'outline';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  success: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60',
  warning: 'bg-amber-950/50 text-amber-400 border-amber-800/60',
  error:   'bg-red-950/50 text-red-400 border-red-800/60',
  outline: 'bg-transparent text-zinc-500 border-zinc-700',
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium ${VARIANTS[variant]} ${className}`}>
    {children}
  </span>
);
