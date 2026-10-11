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
        return 'bg-gradient-to-r from-[#e06c75] to-[#f0989e] text-white border-transparent hover:brightness-105 shadow-[0_4px_14px_rgba(224,108,117,0.3)] hover:-translate-y-px';
      case 'secondary':
        return 'bg-[#111111] text-[#9cdef2] border-[#355a66] hover:border-[#e06c75] hover:-translate-y-px';
      case 'accent':
        return 'bg-[#50fa7b]/15 text-[#50fa7b] border-[#50fa7b]/40 hover:bg-[#50fa7b]/25 hover:-translate-y-px';
      case 'destructive':
        return 'bg-[#e06c75]/15 text-[#e06c75] border-[#e06c75]/30 hover:bg-[#e06c75]/25';
      case 'outline':
        return 'bg-transparent text-[#9cdef2] border-[#355a66] hover:border-[#e06c75] hover:bg-[#1e2228]';
      default:
        return 'bg-gradient-to-r from-[#e06c75] to-[#f0989e] text-white border-transparent';
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-mono transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
