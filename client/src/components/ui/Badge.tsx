import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'outline' | 'accent';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-[#141414] text-white border-[#222222]',
  success: 'bg-[#0a0a0a] text-[#4ade80] border-[#222222]',
  warning: 'bg-[#0a0a0a] text-[#fbbf24] border-[#222222]',
  error:   'bg-[#0a0a0a] text-[#f87171] border-[#222222]',
  outline: 'bg-transparent text-[#71717a] border-[#222222]',
  accent:  'bg-white text-black border-white font-semibold',
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
