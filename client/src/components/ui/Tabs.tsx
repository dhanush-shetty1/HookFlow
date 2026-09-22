import React from 'react';
import { motion } from 'framer-motion';

interface Tab { id: string; label: string; }
interface TabsProps { tabs: Tab[]; active: string; onChange: (id: string) => void; className?: string; }

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className = '' }) => (
  <div className={`flex items-center border-b border-zinc-800 ${className}`}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`relative px-4 py-2.5 text-xs font-medium transition-colors ${
          active === tab.id ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        {tab.label}
        {active === tab.id && (
          <motion.div
            layoutId="tab-underline"
            className="absolute bottom-0 left-0 right-0 h-px bg-zinc-300"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
      </button>
    ))}
  </div>
);
