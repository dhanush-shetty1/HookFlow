import React from 'react';
import { motion } from 'framer-motion';

interface Tab { id: string; label: string; }
interface TabsProps { tabs: Tab[]; active: string; onChange: (id: string) => void; className?: string; }

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className = '' }) => (
  <div className={`flex items-center border-b border-[#222222] ${className}`}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`relative px-4 py-2.5 text-xs font-mono font-medium transition-colors ${
          active === tab.id ? 'text-white' : 'text-[#71717a] hover:text-white'
        }`}
      >
        {tab.label}
        {active === tab.id && (
          <motion.div
            layoutId="tab-underline"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
      </button>
    ))}
  </div>
);
