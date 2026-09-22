import React from 'react';

/**
 * ShimmerButton — clean, smooth shimmer sweep on hover.
 * No neo-brutalism. Pure Aceternity/shadcn dark glass style.
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
  const base = 'relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold overflow-hidden transition-all duration-300 select-none disabled:opacity-40 disabled:pointer-events-none';

  const sizes: Record<string, string> = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-sm',
  };

  const variants: Record<string, string> = {
    primary:
      'bg-zinc-50 text-zinc-950 hover:bg-white active:scale-[0.97] shadow-md hover:shadow-zinc-200/20',
    ghost:
      'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-900 active:scale-[0.97]',
    outline:
      'bg-transparent text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.97] backdrop-blur-sm',
    glass:
      'bg-zinc-900/60 text-zinc-100 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/70 backdrop-blur-md active:scale-[0.97]',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Shimmer sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        style={{ animation: 'shimmer-slide 2.5s infinite' }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};
