import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-zinc-100 text-zinc-950 border-zinc-100 hover:bg-white active:bg-zinc-200 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.35)]';
      case 'secondary':
        return 'bg-zinc-900 text-zinc-100 border-zinc-700 hover:bg-zinc-800 shadow-[3px_3px_0px_0px_#27272a] hover:shadow-[5px_5px_0px_0px_#3f3f46]';
      case 'accent':
        return 'bg-emerald-500 text-zinc-950 font-bold border-emerald-400 hover:bg-emerald-400 shadow-[3px_3px_0px_0px_rgba(16,185,129,0.3)] hover:shadow-[5px_5px_0px_0px_rgba(16,185,129,0.5)]';
      case 'destructive':
        return 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)]';
      case 'outline':
        return 'bg-transparent text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 shadow-[3px_3px_0px_0px_#18181b]';
      default:
        return 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'md':
        return 'px-4 py-2 text-xs font-semibold';
      case 'lg':
        return 'px-6 py-3 text-sm font-semibold';
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-mono transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none select-none disabled:opacity-50 disabled:pointer-events-none ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
