import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Terminal, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroQuickstartPill: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeMode, setActiveMode] = useState<'cli' | 'endpoint'>('cli');

  const cliCommand = 'npx hookflow listen --tunnel';
  const endpointUrl = 'https://hookflow.dev/hook/ep_quickstart';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="w-full max-w-xl mx-auto select-none font-mono">
      {/* Outer Elf-inspired Pill Container */}
      <div className="relative p-1.5 rounded-full bg-[#0a0a0c]/90 backdrop-blur-xl border border-[#27272a] shadow-[0_12px_45px_rgba(0,0,0,0.85)] hover:border-[#3f3f46] transition-all flex items-center justify-between gap-2 group">
        
        {/* Left input area / icon / command text */}
        <div className="flex items-center gap-3 pl-3.5 sm:pl-4 overflow-hidden flex-1">
          <Terminal className="w-4 h-4 text-[#71717a] group-hover:text-white transition-colors flex-shrink-0" />
          
          <div className="truncate text-xs sm:text-sm">
            <span className="text-[#71717a] mr-1.5 select-none">$</span>
            <span className="text-white font-medium tracking-tight">
              {cliCommand}
            </span>
          </div>
        </div>

        {/* Right CTA button */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleCopy(cliCommand)}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 active:scale-95 shadow-sm ${
              copied
                ? 'bg-[#152e1b] text-[#4ade80] border border-[#4ade80]/30'
                : 'bg-white text-black hover:bg-[#e4e4e7]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                <span className="font-mono">Copied!</span>
              </>
            ) : (
              <>
                <span>Copy Command</span>
                <Copy className="w-3.5 h-3.5 text-black" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Micro Status Below Pill */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-[#71717a]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
          <span>Sub-15ms broadcast</span>
        </span>
        <span>•</span>
        <span>No signup required</span>
        <span>•</span>
        <button
          onClick={() => navigate('/console')}
          className="text-[#a1a1aa] hover:text-white transition-colors underline underline-offset-4 decoration-[#333333] hover:decoration-white"
        >
          or launch web console →
        </button>
      </div>
    </div>
  );
};

