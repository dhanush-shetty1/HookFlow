import React from 'react';

/**
 * ShimmerButton — styled for Odysseus UI.
 */
interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const base = 'relative inline-flex items-center justify-center gap-2 rounded-lg font-mono font-semibold overflow-hidden transition-all duration-200 select-none disabled:opacity-40 disabled:pointer-events-none';

  const sizes: Record<string, string> = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs',
    lg: 'px-7 py-3.5 text-sm',
  };

  const variants: Record<string, string> = {
    primary:
      'bg-gradient-to-r from-[#e06c75] to-[#f0989e] text-white hover:brightness-105 active:scale-[0.98] shadow-[0_4px_14px_rgba(224,108,117,0.35)]',
    ghost:
      'bg-transparent text-[#6b8a94] hover:text-[#9cdef2] hover:bg-[#1e2228] active:scale-[0.98]',
    outline:
      'bg-transparent text-[#9cdef2] border border-[#355a66] hover:border-[#e06c75] hover:bg-[#111111] active:scale-[0.98]',
    glass:
      'bg-[#111111]/80 text-[#9cdef2] border border-[#355a66] hover:border-[#e06c75] hover:bg-[#1e2228] active:scale-[0.98]',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Shimmer sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#9cdef2]/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        style={{ animation: 'shimmer-slide 2.5s infinite' }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};
