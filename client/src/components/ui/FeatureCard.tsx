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
  accentColor?: 'violet' | 'blue' | 'amber' | 'cyan' | 'emerald' | 'pink' | 'rose';
}

const ACCENT_STYLES = {
  violet: {
    borderHover: 'hover:border-purple-500/50',
    iconBg: 'group-hover:text-purple-400 group-hover:bg-purple-950/30 group-hover:border-purple-800/50',
    prism: 'from-purple-500/10 via-transparent to-transparent',
    tag: 'group-hover:text-purple-300',
  },
  blue: {
    borderHover: 'hover:border-sky-500/50',
    iconBg: 'group-hover:text-sky-400 group-hover:bg-sky-950/30 group-hover:border-sky-800/50',
    prism: 'from-sky-500/10 via-transparent to-transparent',
    tag: 'group-hover:text-sky-300',
  },
  amber: {
    borderHover: 'hover:border-amber-500/50',
    iconBg: 'group-hover:text-amber-400 group-hover:bg-amber-950/30 group-hover:border-amber-800/50',
    prism: 'from-amber-500/10 via-transparent to-transparent',
    tag: 'group-hover:text-amber-300',
  },
  cyan: {
    borderHover: 'hover:border-cyan-500/50',
    iconBg: 'group-hover:text-cyan-400 group-hover:bg-cyan-950/30 group-hover:border-cyan-800/50',
    prism: 'from-cyan-500/10 via-transparent to-transparent',
    tag: 'group-hover:text-cyan-300',
  },
  emerald: {
    borderHover: 'hover:border-emerald-500/50',
    iconBg: 'group-hover:text-emerald-400 group-hover:bg-emerald-950/30 group-hover:border-emerald-800/50',
    prism: 'from-emerald-500/10 via-transparent to-transparent',
    tag: 'group-hover:text-emerald-300',
  },
  rose: {
    borderHover: 'hover:border-rose-500/50',
    iconBg: 'group-hover:text-rose-400 group-hover:bg-rose-950/30 group-hover:border-rose-800/50',
    prism: 'from-rose-500/10 via-transparent to-transparent',
    tag: 'group-hover:text-rose-300',
  },
  pink: {
    borderHover: 'hover:border-pink-500/50',
    iconBg: 'group-hover:text-pink-400 group-hover:bg-pink-950/30 group-hover:border-pink-800/50',
    prism: 'from-pink-500/10 via-transparent to-transparent',
    tag: 'group-hover:text-pink-300',
  },
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  index,
  tag,
  icon,
  title,
  description,
  items,
  meta,
  accentColor = 'blue',
}) => {
  const accent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.blue;

  return (
    <div
      className={`group relative rounded-xl border border-zinc-800/90 bg-[#08080a] p-6 h-full flex flex-col justify-between overflow-hidden transition-all duration-300 ${accent.borderHover} hover:bg-[#0c0c0f] hover:shadow-xl hover:shadow-black/60`}
    >
      {/* Background Calyx Prism Accent on hover */}
      <div
        className={`pointer-events-none absolute -inset-full bg-gradient-to-br ${accent.prism} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Top header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-all duration-300 ${accent.iconBg}`}
            >
              {icon}
            </div>
            <span
              className={`text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase transition-colors ${accent.tag}`}
            >
              {tag}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-zinc-700 group-hover:text-zinc-400 transition-colors">
            {index}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm font-semibold text-zinc-100 mb-2 tracking-tight group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-normal mb-4 flex-1">
          {description}
        </p>

        {/* Bullet checklist (Calyx capability style) */}
        {items && items.length > 0 && (
          <ul className="space-y-1.5 my-3 pt-3 border-t border-zinc-900 text-[11px] font-mono text-zinc-400">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-zinc-300">
                <Check className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
                <span className="truncate">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Meta Footer */}
      <div className="relative z-10 mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span className="truncate font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors">
          {meta}
        </span>
        <span className="text-zinc-700 group-hover:text-zinc-300 transition-colors flex-shrink-0">
          →
        </span>
      </div>
    </div>
  );
};
