import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  FileCode2,
  Lock
} from 'lucide-react';

export const InteractiveFeatureGrid: React.FC = () => {
  // Card 1 state
  const [selectedEvent, setSelectedEvent] = useState<'stripe' | 'github' | 'clerk'>('stripe');

  // Card 3 state
  const [schemaTab, setSchemaTab] = useState<'ts' | 'zod'>('ts');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-14 font-mono">
      
      {/* ── SECTION HEADER (Clean Developer Narrative) ───────────────────── */}
      <div className="max-w-4xl">
        <div className="text-[11px] text-[#71717a] font-medium tracking-wider uppercase mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>PIPELINE INSPECTION</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-semibold tracking-tight text-white leading-relaxed">
          HookFlow{' '}
          <span className="inline-block px-2 py-0.5 rounded bg-[#141414] text-white border border-[#27272a] text-lg sm:text-2xl">
            captures
          </span>{' '}
          <span className="text-[11px] text-[#71717a] align-top">01</span>{' '}
          every webhook signal,{' '}
          <span className="inline-block px-2 py-0.5 rounded bg-[#141414] text-white border border-[#27272a] text-lg sm:text-2xl">
            verifies
          </span>{' '}
          <span className="text-[11px] text-[#71717a] align-top">02</span>{' '}
          HMAC signatures cryptographically, and{' '}
          <span className="inline-block px-2 py-0.5 rounded bg-[#141414] text-white border border-[#27272a] text-lg sm:text-2xl">
            synthesizes
          </span>{' '}
          <span className="text-[11px] text-[#71717a] align-top">03</span>{' '}
          strict schemas before you write boilerplate.
        </h2>
      </div>

      {/* ── 3 INTERACTIVE MINI-WORKSPACE CARDS (Minimalist Black Theme) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CARD 01: EVENT BUS STREAM */}
        <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] hover:border-[#383838] transition-colors p-5 flex flex-col justify-between">
          <div>
            {/* Miniature App Window */}
            <div className="rounded border border-[#1f1f1f] bg-black overflow-hidden mb-5 text-xs">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] bg-[#0e0e0e]">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                </div>
                <span className="text-[10px] text-[#71717a]">ws-stream · 12ms</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              </div>

              {/* Event rows */}
              <div className="divide-y divide-[#181818] p-1 bg-black">
                <div 
                  onClick={() => setSelectedEvent('stripe')}
                  className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-between ${
                    selectedEvent === 'stripe' ? 'bg-[#141414] border-l-2 border-white' : 'hover:bg-[#0d0d0d]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#1a1a1a] text-white">POST</span>
                    <span className="text-[11px] text-[#e4e4e7] truncate">payment_intent.succeeded</span>
                  </div>
                  <span className="text-[10px] text-[#4ade80] tabular-nums">8ms</span>
                </div>

                <div 
                  onClick={() => setSelectedEvent('github')}
                  className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-between ${
                    selectedEvent === 'github' ? 'bg-[#141414] border-l-2 border-white' : 'hover:bg-[#0d0d0d]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#1a1a1a] text-[#a1a1aa]">POST</span>
                    <span className="text-[11px] text-[#a1a1aa] truncate">push: main (0d1a26e)</span>
                  </div>
                  <span className="text-[10px] text-[#71717a] tabular-nums">11ms</span>
                </div>

                <div 
                  onClick={() => setSelectedEvent('clerk')}
                  className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-between ${
                    selectedEvent === 'clerk' ? 'bg-[#141414] border-l-2 border-white' : 'hover:bg-[#0d0d0d]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#1a1a1a] text-[#a1a1aa]">POST</span>
                    <span className="text-[11px] text-[#a1a1aa] truncate">user.created</span>
                  </div>
                  <span className="text-[10px] text-[#71717a] tabular-nums">9ms</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-[#71717a] uppercase tracking-wider mb-1">01 / INGESTION</div>
            <h3 className="text-sm font-semibold text-white mb-2">Real-Time WebSocket Stream</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Sub-15ms broadcast directly into your local dashboard. Inspect raw payloads, custom headers, and query parameters instantaneously.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#181818] flex items-center justify-between text-xs text-[#71717a]">
            <span>Latency: &lt; 15ms</span>
            <span className="text-white flex items-center gap-1">
              <span>View stream</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* CARD 02: HMAC TRACE INSPECTOR */}
        <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] hover:border-[#383838] transition-colors p-5 flex flex-col justify-between">
          <div>
            {/* Miniature HMAC Terminal Window */}
            <div className="rounded border border-[#1f1f1f] bg-black overflow-hidden mb-5 text-xs">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] bg-[#0e0e0e]">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                </div>
                <span className="text-[10px] text-[#71717a]">hmac-verify.log</span>
                <span className="text-[10px] text-[#a1a1aa]">SHA-256</span>
              </div>

              <div className="p-3 space-y-2 bg-black text-[11px]">
                <div className="text-[#71717a] truncate font-mono">
                  $ crypto.timingSafeEqual(hash, expected)
                </div>
                <div className="p-2 rounded bg-[#0a0a0a] border border-[#1f1f1f] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[#71717a]">Tolerance:</span>
                    <span className="text-[#4ade80]">Delta 1.2s &lt; 300s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#71717a]">Digest:</span>
                    <span className="text-[#a1a1aa] truncate max-w-[120px]">55dd8cc8e9...</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#71717a]">Result:</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#052e16] border border-[#14532d] text-[#4ade80]">
                    PASS · 0.04ms
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-[#71717a] uppercase tracking-wider mb-1">02 / VERIFICATION</div>
            <h3 className="text-sm font-semibold text-white mb-2">Cryptographic HMAC Inspector</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Detect spoofed webhooks before executing code. Built-in timingSafeEqual comparisons for Stripe, GitHub, Shopify, and Clerk.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#181818] flex items-center justify-between text-xs text-[#71717a]">
            <span>Algorithm: SHA-256</span>
            <span className="text-white flex items-center gap-1">
              <span>Inspect trace</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* CARD 03: SYNTHESIZER */}
        <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] hover:border-[#383838] transition-colors p-5 flex flex-col justify-between">
          <div>
            {/* Miniature Code Snippet Window */}
            <div className="rounded border border-[#1f1f1f] bg-black overflow-hidden mb-5 text-xs">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] bg-[#0e0e0e]">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                  <span className="w-2 h-2 rounded-full bg-[#333333]" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSchemaTab('ts')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      schemaTab === 'ts' ? 'bg-[#181818] text-white border border-[#27272a]' : 'text-[#71717a]'
                    }`}
                  >
                    TS
                  </button>
                  <button
                    onClick={() => setSchemaTab('zod')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      schemaTab === 'zod' ? 'bg-[#181818] text-white border border-[#27272a]' : 'text-[#71717a]'
                    }`}
                  >
                    Zod
                  </button>
                </div>
              </div>

              <div className="p-3 bg-black text-[11px] text-[#d4d4d8] font-mono leading-relaxed h-[130px] overflow-y-auto">
                <pre className="whitespace-pre">
                  {schemaTab === 'ts' ? (
`export interface WebhookEvent {
  id: string;
  amount: number;
  currency: "usd";
  status: "succeeded";
}`
                  ) : (
`export const EventSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.literal("usd"),
});`
                  )}
                </pre>
              </div>
            </div>

            <div className="text-[10px] text-[#71717a] uppercase tracking-wider mb-1">03 / SCHEMA SYNTHESIS</div>
            <h3 className="text-sm font-semibold text-white mb-2">Zero-Boilerplate Type Inference</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Local AST parsers extract TypeScript types and Zod schemas from complex nested payloads in under 300ms.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#181818] flex items-center justify-between text-xs text-[#71717a]">
            <span>Latency: &lt; 0.3s</span>
            <span className="text-white flex items-center gap-1">
              <span>View schema</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

      </div>

      {/* ── "HOW IT WORKS" 3-STEP CONNECTED GRID ──────────────────────────── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">How it works</h3>
          <span className="text-xs text-[#71717a]">3-step workflow</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px overflow-hidden rounded-lg border border-[#222222] bg-[#222222]">
          {/* Step 01 */}
          <div className="bg-black p-5 hover:bg-[#080808] transition-colors">
            <span className="text-xs text-[#71717a]">01</span>
            <h4 className="mt-3 text-sm font-semibold text-white">Generate Endpoint</h4>
            <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
              Create an isolated webhook endpoint in 1 click or start a local tunnel with <code className="text-white">npx hookflow listen</code>.
            </p>
          </div>

          {/* Step 02 */}
          <div className="bg-black p-5 hover:bg-[#080808] transition-colors">
            <span className="text-xs text-[#71717a]">02</span>
            <h4 className="mt-3 text-sm font-semibold text-white">Verify HMAC</h4>
            <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
              Incoming webhooks stream in sub-15ms with timingSafeEqual signature validation and full header extraction.
            </p>
          </div>

          {/* Step 03 */}
          <div className="bg-black p-5 hover:bg-[#080808] transition-colors">
            <span className="text-xs text-[#71717a]">03</span>
            <h4 className="mt-3 text-sm font-semibold text-white">Synthesize & Replay</h4>
            <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
              Generate zero-boilerplate TypeScript & Zod schemas, then replay captured payloads to localhost:3000.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
