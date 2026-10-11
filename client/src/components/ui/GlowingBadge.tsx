import React from 'react';
import { motion } from 'framer-motion';

interface GlowingBadgeProps {
  children: React.ReactNode;
  color?: 'emerald' | 'sky' | 'purple' | 'amber' | 'rose' | 'coral' | 'cyan' | 'green';
  className?: string;
}

export const GlowingBadge: React.FC<GlowingBadgeProps> = ({
  children,
  color = 'green',
  className = '',
}) => {
  const colors: Record<string, { dot: string; glow: string; border: string; text: string }> = {
    green: {
      dot: 'bg-[#50fa7b]',
      glow: 'bg-[#50fa7b]',
      border: 'border-[#50fa7b]/40',
      text: 'text-[#50fa7b]',
    },
    emerald: {
      dot: 'bg-[#50fa7b]',
      glow: 'bg-[#50fa7b]',
      border: 'border-[#50fa7b]/40',
      text: 'text-[#50fa7b]',
    },
    cyan: {
      dot: 'bg-[#9cdef2]',
      glow: 'bg-[#9cdef2]',
      border: 'border-[#355a66]',
      text: 'text-[#9cdef2]',
    },
    sky: {
      dot: 'bg-[#9cdef2]',
      glow: 'bg-[#9cdef2]',
      border: 'border-[#355a66]',
      text: 'text-[#9cdef2]',
    },
    coral: {
      dot: 'bg-[#e06c75]',
      glow: 'bg-[#e06c75]',
      border: 'border-[#e06c75]/40',
      text: 'text-[#e06c75]',
    },
    rose: {
      dot: 'bg-[#e06c75]',
      glow: 'bg-[#e06c75]',
      border: 'border-[#e06c75]/40',
      text: 'text-[#e06c75]',
    },
    purple: {
      dot: 'bg-[#f0989e]',
      glow: 'bg-[#f0989e]',
      border: 'border-[#f0989e]/40',
      text: 'text-[#f0989e]',
    },
    amber: {
      dot: 'bg-[#f0ad4e]',
      glow: 'bg-[#f0ad4e]',
      border: 'border-[#f0ad4e]/40',
      text: 'text-[#f0ad4e]',
    },
  };

  const c = colors[color] || colors.green;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${c.border} bg-[#111111]/90 backdrop-blur-sm ${className}`}
    >
      <div className="relative flex">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <motion.span
          className={`absolute inset-0 rounded-full ${c.glow} opacity-70`}
          animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <span className={`text-xs font-mono font-medium ${c.text}`}>{children}</span>
    </div>
  );
};
