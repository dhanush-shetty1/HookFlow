import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface TechGridItem {
  id: string;
  name: string;
  category: string;
  spec: string;
  icon: React.ReactNode;
}

const GRID_ITEMS: TechGridItem[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'PAYMENTS',
    spec: 'HMAC-SHA256 (t+v1)',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#635bff">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C17.652.84 15.342 0 12.355 0 6.666 0 2.723 3.09 2.723 7.854c0 4.887 4.095 6.46 7.643 7.72 2.775.98 3.738 1.687 3.738 2.71 0 .93-.843 1.55-2.31 1.55-2.357 0-5.324-1.109-7.14-2.193L3.72 25.13c2.04 1.144 5.378 1.87 8.528 1.87 6.027 0 10.05-2.91 10.05-7.854 0-4.996-3.957-6.524-8.322-7.996z"/>
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'GIT & CI/CD',
    spec: 'x-hub-signature-256',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#ffffff">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'E-COMMERCE',
    spec: 'Base64 HMAC-SHA256',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#95bf47">
        <path d="M19.66 4.22l-2.05-.62a.45.45 0 00-.51.27l-.92 2.32c-.08-.03-.17-.06-.27-.08l-.83-2.11a.45.45 0 00-.5-.28l-2.07.63a.47.47 0 00-.31.39L11.53 9.4c-.45.1-.88.24-1.29.41L7.87 3.55a.46.46 0 00-.51-.25L2.3 4.68a.46.46 0 00-.35.43c-.02.49 1.15 15.65 1.15 15.65.04.53.48.94 1.01.94h14.8c.53 0 .97-.41 1.01-.94 0 0 1.09-14.77 1.13-15.63a.46.46 0 00-.39-.46z"/>
      </svg>
    ),
  },
  {
    id: 'clerk',
    name: 'Clerk / Svix',
    category: 'AUTH & SECURITY',
    spec: 'svix-signature v1',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#6c47ff">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 4.18c2.11 0 3.82 1.71 3.82 3.82 0 2.11-1.71 3.82-3.82 3.82-2.11 0-3.82-1.71-3.82-3.82 0-2.11 1.71-3.82 3.82-3.82zm0 14.74c-2.7 0-5.02-1.37-6.36-3.48.05-2.11 4.24-3.26 6.36-3.26 2.11 0 6.31 1.15 6.36 3.26-1.34 2.11-3.66 3.48-6.36 3.48z"/>
      </svg>
    ),
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'TELEPHONY & SMS',
    spec: 'x-twilio-signature',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#f22f46">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.8a2.4 2.4 0 110 4.8 2.4 2.4 0 010-4.8zm-4.8 4.8a2.4 2.4 0 110 4.8 2.4 2.4 0 010-4.8zm4.8 4.8a2.4 2.4 0 110 4.8 2.4 2.4 0 010-4.8zm4.8-4.8a2.4 2.4 0 110 4.8 2.4 2.4 0 010-4.8z"/>
      </svg>
    ),
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'BOT INTERACTIONS',
    spec: 'Ed25519 Public Key',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#5865f2">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028z"/>
      </svg>
    ),
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'MESSAGING & EVENTS',
    spec: 'v0=HMAC-SHA256',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#e01e5a"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36c5f0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2eb67d"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ecb22e"/>
      </svg>
    ),
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'AI SYNTHESIS',
    spec: 'AST Schema Engine',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" fill="url(#gemini-grid-grad)"/>
        <defs>
          <linearGradient id="gemini-grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a73e8" />
            <stop offset="50%" stopColor="#9334e6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'TYPE GENERATION',
    spec: 'Strict AST Interfaces',
    icon: (
      <svg className="w-6 h-6 rounded-xs" viewBox="0 0 24 24" fill="#3178c6">
        <rect width="24" height="24" rx="3" fill="#3178c6"/>
        <path d="M12.8 17.5c.6.3 1.4.5 2.2.5 2.1 0 3.3-1.1 3.3-2.8 0-1.6-.9-2.5-2.6-3.2l-.7-.3c-1.1-.5-1.5-.9-1.5-1.6 0-.8.7-1.4 1.8-1.4.8 0 1.5.2 2 .5l.5-1.8c-.5-.2-1.3-.4-2.2-.4-2.2 0-3.5 1.2-3.5 2.9 0 1.5.9 2.5 2.4 3.1l.7.3c1.2.5 1.7 1 1.7 1.8 0 .9-.8 1.5-2 1.5-.9 0-1.8-.3-2.4-.7l-.6 1.8zM4.5 8.8h6.2v1.9H8.7v6.8H6.5v-6.8H4.5V8.8z" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'ROUTE HANDLERS',
    spec: 'App Router ready',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.88 17.65L9.62 6.88H7.76V17.12h1.68V9.75l7.08 9.53a10.02 10.02 0 001.36-1.63zM14.56 6.88h1.68v7.62h-1.68V6.88z"/>
      </svg>
    ),
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'PERSISTENCE',
    spec: 'Embedded & Cluster Store',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#47a248">
        <path d="M12 0C11.6 0 9 5.3 9 11.2c0 5 2.5 8.9 3 9.8.5-.9 3-4.8 3-9.8C15 5.3 12.4 0 12 0zm-.3 23.9s.1 0 .2.1c.1 0 .2-.1.2-.1.3-.4 1.1-1.7 1.1-2.9h-2.4c0 1.2.7 2.5 1.1 2.9h-.2z"/>
      </svg>
    ),
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'CONTAINER RUNTIME',
    spec: 'One-line docker-compose',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#2496ed">
        <path d="M13 5.5h2v2h-2zm-3 0h2v2h-2zm-3 0h2v2H7zm6 3h2v2h-2zm-3 0h2v2h-2zm-3 0h2v2H7zm-3 0h2v2H4zm12 0h2v2h-2zm5.5 3c-.5-1.5-2-1.5-2-1.5H2v3c0 4 3.5 7.5 8 7.5 5 0 8.5-3.5 9.5-7.5.5 0 2 0 2.5-1.5z"/>
      </svg>
    ),
  },
];

export const ProviderLogoGrid: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto font-mono text-left">
      {/* ── SECTION HEADER ──────────────────────────────────────────────── */}
      <div className="py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] text-[#71717a] font-mono tracking-wider uppercase mb-1.5">
            Supported Ecosystem
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Tech Stack &amp; Integrated Providers
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#71717a] max-w-md sm:text-right font-mono leading-relaxed">
          Symmetrical fine-line architecture with constant-time HMAC verification, schema synthesis, and localhost replaying.
        </p>
      </div>

      {/* ── SYMMETRICAL 6x2 BALANCED GRID (Deep dark, authentic colors, zero flashy glows) ── */}
      <div className="rounded-xl border border-[#222222] bg-[#08080a] overflow-hidden shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-[#222222]">
          {GRID_ITEMS.map((item) => {
            return (
              <div
                key={item.id}
                className="relative p-5 transition-colors duration-150 flex flex-col justify-between min-h-[140px] hover:bg-[#111114] group select-none"
              >
                {/* Category Spec Tag */}
                <div className="text-[10px] text-[#71717a] font-mono tracking-wider truncate mb-2">
                  {item.category}
                </div>

                {/* Central Brand SVG + Name */}
                <div className="my-2.5 flex flex-col items-center justify-center text-center gap-2">
                  <div className="transition-transform duration-150 group-hover:scale-105">
                    {item.icon}
                  </div>
                  <span className="text-xs font-semibold tracking-tight text-white">
                    {item.name}
                  </span>
                </div>

                {/* Bottom Technical Spec Footer */}
                <div className="pt-2 border-t border-[#1a1a1c] text-[10px] font-mono text-[#71717a] group-hover:text-[#a1a1aa] transition-colors truncate text-center">
                  {item.spec}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Symmetrical Status Bar */}
        <div className="px-5 py-3 border-t border-[#222222] bg-[#040405] flex flex-wrap items-center justify-between text-xs text-[#71717a] font-mono gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#e4e4e7]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>Zero-config secret injection</span>
            </span>
            <span className="hidden sm:inline text-[#262626]">|</span>
            <span className="hidden sm:inline text-[#a1a1aa]">Supports replay forwarding to localhost:3000</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#71717a]">Validation Engine:</span>
            <code className="text-[#e4e4e7] bg-[#121214] px-1.5 py-0.5 rounded border border-[#222222]">
              crypto.timingSafeEqual
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
