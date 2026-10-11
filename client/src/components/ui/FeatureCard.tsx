import React from 'react';
import { Check } from 'lucide-react';

interface FeatureCardProps {
  index: string; // e.g. "01"
  tag: string;   // e.g. "EVENT BUS"
  icon: React.ReactNode;
  title: string;
  description: string;
  items?: string[];
  meta: string;
  accentColor?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  index,
  tag,
  icon,
  title,
  description,
  items,
  meta,
}) => {
  return (
    <div
      className="group relative rounded-lg border border-[#222222] bg-[#0a0a0a] p-5 h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-[#444444]"
    >
      <div className="flex flex-col flex-1">
        {/* Top header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-black border border-[#222222] flex items-center justify-center text-white transition-colors">
              {icon}
            </div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#71717a] uppercase">
              {tag}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-[#52525b]">
            {index}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm font-semibold text-white mb-1.5 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4 flex-1">
          {description}
        </p>

        {/* Bullet checklist */}
        {items && items.length > 0 && (
          <ul className="space-y-1.5 my-2 pt-3 border-t border-[#222222] text-[11px] font-mono text-[#71717a]">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="w-3 h-3 text-[#4ade80] flex-shrink-0" />
                <span className="text-[#d4d4d8] truncate">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Meta Footer */}
      <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-[#71717a]">
        <span className="truncate font-medium group-hover:text-white transition-colors">
          {meta}
        </span>
        <span className="text-[#52525b] group-hover:text-white transition-colors flex-shrink-0 font-bold">
          →
        </span>
      </div>
    </div>
  );
};
