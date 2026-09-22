import React from 'react';
import { motion } from 'framer-motion';

export const TerminalWindow: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title = 'terminal', children, className = '' }) => (
  <div className={`rounded-xl border border-zinc-800 overflow-hidden bg-[#0d0d0f] ${className}`}>
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
      </div>
      <span className="text-[10px] font-mono text-zinc-600 ml-1">{title}</span>
    </div>
    <div className="p-4 font-mono text-[11px] leading-relaxed overflow-auto">{children}</div>
  </div>
);
