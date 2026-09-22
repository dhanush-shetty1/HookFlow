import React from 'react';
import { motion } from 'framer-motion';

interface GlowingBadgeProps {
  children: React.ReactNode;
  color?: 'emerald' | 'sky' | 'purple' | 'amber' | 'rose';
  className?: string;
}

export const GlowingBadge: React.FC<GlowingBadgeProps> = ({
  children,
  color = 'emerald',
  className = '',
}) => {
  const colors: Record<string, { dot: string; glow: string; border: string; text: string }> = {
    emerald: {
      dot: 'bg-emerald-400',
      glow: 'bg-emerald-400',
      border: 'border-emerald-900',
      text: 'text-emerald-300',
    },
    sky: {
      dot: 'bg-sky-400',
      glow: 'bg-sky-400',
      border: 'border-sky-900',
      text: 'text-sky-300',
    },
    purple: {
      dot: 'bg-purple-400',
      glow: 'bg-purple-400',
      border: 'border-purple-900',
      text: 'text-purple-300',
    },
    amber: {
      dot: 'bg-amber-400',
      glow: 'bg-amber-400',
      border: 'border-amber-900',
      text: 'text-amber-300',
    },
    rose: {
      dot: 'bg-rose-400',
      glow: 'bg-rose-400',
      border: 'border-rose-900',
      text: 'text-rose-300',
    },
  };

  const c = colors[color];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${c.border} bg-zinc-950/80 backdrop-blur-sm ${className}`}
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
