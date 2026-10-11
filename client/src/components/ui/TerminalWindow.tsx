import React from 'react';
import { Minus, X } from 'lucide-react';

export const TerminalWindow: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title = 'user@hookflow: ~', children, className = '' }) => (
  <div className={`rounded-xl border border-[#222222] overflow-hidden bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${className}`}>
    <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#222222] bg-[#121212]">
      <span className="text-xs font-mono text-[#a1a1aa]">{title}</span>
      <div className="flex items-center gap-1">
        <span className="w-5 h-4 inline-flex items-center justify-center rounded text-xs text-[#71717a] hover:bg-white/10 hover:text-white cursor-pointer transition-colors">
          <Minus className="w-3 h-3" />
        </span>
        <span className="w-5 h-4 inline-flex items-center justify-center rounded text-xs text-[#71717a] hover:bg-white/10 hover:text-white cursor-pointer transition-colors">
          <X className="w-3 h-3" />
        </span>
      </div>
    </div>
    <div className="p-4 font-mono text-xs leading-relaxed overflow-auto text-[#e4e4e7]">{children}</div>
  </div>
);
