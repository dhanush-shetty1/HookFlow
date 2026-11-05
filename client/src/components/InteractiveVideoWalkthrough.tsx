import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  Layers,
  Check
} from 'lucide-react';

interface Chapter {
  id: number;
  tag: string;
  name: string;
  startTime: number;
  endTime: number;
  icon: React.FC<{ className?: string }>;
  description: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    tag: '01 / INGEST',
    name: 'WebSocket Ingestion',
    startTime: 0,
    endTime: 3.5,
    icon: Zap,
    description: 'Public webhook caught at edge tunnel and streamed via WebSockets (<15ms).',
  },
  {
    id: 2,
    tag: '02 / VERIFY',
    name: 'Cryptographic HMAC',
    startTime: 3.5,
    endTime: 7.0,
    icon: ShieldCheck,
    description: 'Constant-time HMAC-SHA256 signature verification preventing spoofed attacks.',
  },
  {
    id: 3,
    tag: '03 / SYNTHESIZE',
    name: 'AI Schema Synthesis',
    startTime: 7.0,
    endTime: 10.5,
    icon: Sparkles,
    description: 'AST & Gemini engines infer strict TypeScript types and Zod schemas in < 0.3s.',
  },
  {
    id: 4,
    tag: '04 / REPLAY',
    name: 'Localhost Replay',
    startTime: 10.5,
    endTime: 14.0,
    icon: RefreshCw,
    description: '1-click forward with preserved headers directly to your local dev server.',
  },
];

const TOTAL_DURATION = 14.0; // Snappy 14 seconds autonomous loop

export const InteractiveVideoWalkthrough: React.FC = () => {
  // Autonomous loop timer
  const [currentTime, setCurrentTime] = useState(0);

  // Auto-advance loop
  useEffect(() => {
    const stepMs = 100;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1;
        if (next >= TOTAL_DURATION) {
          return 0; // seamless continuous loop
        }
        return parseFloat(next.toFixed(2));
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, []);

  // Determine current active chapter
  const currentChapter = CHAPTERS.find(
    (c) => currentTime >= c.startTime && currentTime < c.endTime
  ) || CHAPTERS[0];

  return (
    <div className="relative w-full max-w-6xl mx-auto rounded-2xl border border-[#222222] bg-[#050505] shadow-[0_20px_80px_rgba(0,0,0,0.85)] overflow-hidden font-mono text-xs select-none">
      
      {/* ── AUTONOMOUS DISPLAY HEADER (NO YOUTUBE BUTTONS) ───────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#222222] bg-[#0c0c0e]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>

          <div className="h-3.5 w-px bg-[#262626]" />

          <div className="flex items-center gap-2 text-[#a1a1aa]">
            <span className="text-white font-semibold tracking-tight text-xs">
              hookflow_live_pipeline_feed
            </span>
            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] bg-[#1a1a1c] text-[#71717a] border border-[#262626]">
              60 FPS · AUTOPLAY
            </span>
          </div>
        </div>

        {/* Live Status Indicators (Clean, no flashy ping) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#161618] border border-[#262626] text-[10px] text-[#e4e4e7]">
            <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
            <span className="font-semibold tracking-wider">LIVE DISPLAY</span>
          </div>
        </div>
      </div>

      {/* ── CHAPTER TABS (CLEAN & NON-LOADER) ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#1c1c1f] bg-[#08080a] divide-x divide-[#1c1c1f]">
        {CHAPTERS.map((chapter) => {
          const isActive = currentChapter.id === chapter.id;
          const Icon = chapter.icon;

          return (
            <div
              key={chapter.id}
              className={`p-3 text-left transition-colors duration-200 ${
                isActive ? 'bg-[#121215]' : 'bg-[#08080a]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-mono tracking-wider ${
                    isActive ? 'text-[#4ade80] font-semibold' : 'text-[#71717a]'
                  }`}
                >
                  {chapter.tag}
                </span>
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isActive ? 'text-white' : 'text-[#52525b]'
                  }`}
                />
              </div>

              <div
                className={`text-xs font-semibold truncate transition-colors ${
                  isActive ? 'text-white' : 'text-[#a1a1aa]'
                }`}
              >
                {chapter.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── AUTONOMOUS DISPLAY VIEWPORT ───────────────────────────────────── */}
      <div className="relative min-h-[380px] sm:min-h-[430px] p-5 sm:p-8 flex flex-col justify-between bg-black">
        <div className="relative z-10 w-full">
          <AnimatePresence mode="wait">
            {/* ── CHAPTER 1: INGESTION (0.0s - 3.5s) ── */}
            {currentChapter.id === 1 && (
              <motion.div
                key="chap-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#71717a] tracking-wider">
                      STAGE 01 / EDGE INGESTION & WEBSOCKET BROADCAST
                    </span>
                    <h3 className="text-lg sm:text-2xl font-bold text-white mt-0.5">
                      Incoming HTTP POST Caught at Ingress Tunnel
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#161618] border border-[#222222] text-[#4ade80] font-mono text-[11px] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Broadcast: 8.2ms</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-[#a1a1aa]">ORIGIN / STRIPE</span>
                      <svg className="w-4 h-4 fill-[#635bff]" viewBox="0 0 24 24">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C17.652.84 15.342 0 12.355 0 6.666 0 2.723 3.09 2.723 7.854c0 4.887 4.095 6.46 7.643 7.72 2.775.98 3.738 1.687 3.738 2.71 0 .93-.843 1.55-2.31 1.55-2.357 0-5.324-1.109-7.14-2.193L3.72 25.13c2.04 1.144 5.378 1.87 8.528 1.87 6.027 0 10.05-2.91 10.05-7.854 0-4.996-3.957-6.524-8.322-7.996z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">Stripe Webhook Dispatcher</div>
                      <div className="text-[11px] text-[#71717a] mt-0.5">payment_intent.succeeded</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1a1a1c] text-[10px] text-[#a1a1aa]">
                      POST 200 OK · Ingress captured
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] flex flex-col justify-center items-center text-center">
                    <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-2">
                      <Zap className="w-4 h-4 text-[#4ade80]" />
                    </div>
                    <span className="text-white font-semibold text-xs">Sub-15ms WebSocket Bus</span>
                    <span className="text-[10px] text-[#71717a] mt-1 font-mono">Payload streamed to localhost</span>
                  </div>

                  <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#a1a1aa] mb-2">
                      <span className="text-[10px] font-semibold">RECIPIENT / CONSOLE</span>
                      <Layers className="w-4 h-4 text-[#71717a]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">HookFlow Local Console</div>
                      <div className="text-[11px] text-[#71717a] mt-0.5">Raw byte buffer retained</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1a1a1c] text-[10px] text-[#4ade80] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                      <span>Zero packet loss</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#222222] bg-[#08080a] font-mono text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-[#71717a] text-[10px] pb-1 border-b border-[#18181a]">
                    <span>INCOMING HTTP HEADERS</span>
                    <span className="text-white">POST /hook/ep_stripe_live</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#71717a]">stripe-signature:</span>
                    <span className="text-[#4ade80] truncate max-w-[320px]">t=1700000000,v1=55dd8cc8e920fa143a918e7c1...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CHAPTER 2: CRYPTOGRAPHIC HMAC (3.5s - 7.0s) ── */}
            {currentChapter.id === 2 && (
              <motion.div
                key="chap-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#71717a] tracking-wider">
                      STAGE 02 / CRYPTOGRAPHIC VALIDATION
                    </span>
                    <h3 className="text-lg sm:text-2xl font-bold text-white mt-0.5">
                      HMAC Signature Verified in Constant Time
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#161618] border border-[#222222] text-[#4ade80] font-mono text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>crypto.timingSafeEqual: VALID</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg border border-[#222222] bg-[#0c0c0e] flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-[#161618] border border-[#262626] flex items-center justify-center text-[10px] font-bold text-white">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-xs">Timestamp Freshness Check</div>
                        <div className="text-[11px] text-[#71717a]">Verified within 300s replay tolerance window</div>
                      </div>
                      <span className="text-[#4ade80] text-[10px]">OK</span>
                    </div>

                    <div className="p-3 rounded-lg border border-[#222222] bg-[#0c0c0e] flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-[#161618] border border-[#262626] flex items-center justify-center text-[10px] font-bold text-white">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-xs">Compute HMAC-SHA256 Hash</div>
                        <div className="text-[11px] text-[#71717a]">Raw buffer hashed against whsec_99af28...</div>
                      </div>
                      <span className="text-[#4ade80] text-[10px]">OK</span>
                    </div>

                    <div className="p-3 rounded-lg border border-[#222222] bg-[#0c0c0e] flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-[#161618] border border-[#262626] flex items-center justify-center text-[10px] font-bold text-[#4ade80]">
                        ✓
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-xs">timingSafeEqual Execution</div>
                        <div className="text-[11px] text-[#71717a]">Passed in 0.04ms · Zero timing leak risk</div>
                      </div>
                      <span className="text-[#4ade80] font-bold text-[10px]">MATCH</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#222222] bg-black p-4 font-mono text-[11px] leading-relaxed flex flex-col justify-between">
                    <div>
                      <div className="text-[#71717a] text-[10px] mb-2 flex items-center justify-between">
                        <span>CRYPTO VERIFICATION KERNEL</span>
                        <span className="text-[#4ade80]">0.04ms</span>
                      </div>
                      <pre className="text-[#a1a1aa] overflow-x-auto">
                        <span className="text-[#71717a]">// Constant time verification against secrets</span>{'\n'}
                        <span className="text-white">const</span> expected = crypto{'\n'}
                        {'  '}.createHmac(<span className="text-[#4ade80]">'sha256'</span>, secret){'\n'}
                        {'  '}.update(rawBuffer).digest(<span className="text-[#4ade80]">'hex'</span>);{'\n'}
                        {'\n'}
                        <span className="text-white">return</span> crypto.<span className="text-[#4ade80] font-bold">timingSafeEqual</span>({'\n'}
                        {'  '}Buffer.from(signature),{'\n'}
                        {'  '}Buffer.from(expected){'\n'}
                        );
                      </pre>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#1a1a1c] text-[10px] text-[#4ade80] flex justify-between">
                      <span>STATUS: AUTHENTIC</span>
                      <span>100% Tamper Proof</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CHAPTER 3: AI SCHEMA SYNTHESIS (7.0s - 10.5s) ── */}
            {currentChapter.id === 3 && (
              <motion.div
                key="chap-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#71717a] tracking-wider">
                      STAGE 03 / AUTOMATED TYPE SYSTEMS
                    </span>
                    <h3 className="text-lg sm:text-2xl font-bold text-white mt-0.5">
                      TypeScript & Zod Schemas Synthesized in &lt; 0.3s
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#161618] border border-[#222222] text-white font-mono text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Gemini + Offline AST</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] font-mono flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[#71717a] text-[10px] mb-2">
                        <span>INBOUND JSON PAYLOAD</span>
                        <span>Stripe Payment</span>
                      </div>
                      <pre className="text-xs text-[#d4d4d8] overflow-x-auto max-h-[170px]">
{`{
  "id": "evt_3N8xyz_live",
  "type": "payment_intent.succeeded",
  "amount": 4999,
  "currency": "usd",
  "customer": {
    "id": "cus_982xKa",
    "email": "alex@company.com"
  }
}`}
                      </pre>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#1a1a1c] text-[10px] text-[#71717a]">
                      6 keys parsed into AST
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#222222] bg-black font-mono flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-2">
                        <span className="text-[#4ade80] flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>SYNTHESIZED STRICT TYPES</span>
                        </span>
                        <span className="text-[#71717a]">0.28s</span>
                      </div>
                      <pre className="text-xs text-white overflow-x-auto max-h-[170px]">
{`export interface StripePaymentPayload {
  id: string;
  type: "payment_intent.succeeded";
  amount: number;
  currency: string;
  customer: {
    id: string;
    email: string;
  };
}`}
                      </pre>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#1a1a1c] flex items-center justify-between text-[10px]">
                      <span className="text-[#71717a]">Copy & paste ready</span>
                      <span className="text-[#4ade80]">TypeScript + Zod</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CHAPTER 4: 1-CLICK REPLAY (10.5s - 14.0s) ── */}
            {currentChapter.id === 4 && (
              <motion.div
                key="chap-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222222] pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#71717a] tracking-wider">
                      STAGE 04 / ZERO-FRICTION LOCALHOST FORWARDING
                    </span>
                    <h3 className="text-lg sm:text-2xl font-bold text-white mt-0.5">
                      Replay Directly to Local Dev Server
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#161618] border border-[#222222] text-[#4ade80] font-mono text-[11px] flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Forwarded (200 OK)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] flex flex-col justify-between">
                    <div className="text-[10px] text-[#71717a] mb-1">ORIGINAL CAPTURE</div>
                    <div className="text-white font-semibold text-sm">HookFlow Event Store</div>
                    <div className="text-[11px] text-[#71717a] mt-0.5">Headers & bodies intact</div>
                    <div className="mt-4 pt-3 border-t border-[#1a1a1c] text-[10px] text-[#71717a]">
                      Preserves signatures
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] flex flex-col justify-center items-center text-center">
                    <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-2">
                      <RefreshCw className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-semibold text-xs">Localhost Forwarder</span>
                    <span className="text-[10px] text-[#71717a] font-mono mt-1">POST → localhost:3000</span>
                  </div>

                  <div className="p-4 rounded-xl border border-[#222222] bg-[#0c0c0e] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] text-[#a1a1aa]">
                      <span>RESPONSE STATUS</span>
                      <span className="font-bold text-[#4ade80]">200 OK</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">Local API Handler</div>
                      <div className="text-[11px] text-[#71717a] mt-0.5">11.4ms roundtrip latency</div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1a1a1c] text-[10px] text-[#4ade80] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Zero tunnel configuration needed</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-[#222222] bg-[#08080a] font-mono text-[11px] text-[#71717a] flex items-center justify-between">
                  <span>Target Route: <code className="text-white">http://localhost:3000/api/webhooks/stripe</code></span>
                  <span className="text-[#4ade80]">Status: 200 OK (11.4ms)</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── AUTONOMOUS STATUS STRIP (WITHOUT TIME COUNTER, NO FLASHY PULSE) ── */}
        <div className="relative z-10 mt-6 pt-3 border-t border-[#1c1c1f] flex items-center justify-between text-[11px] text-[#71717a] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
            <span className="text-white font-medium">{currentChapter.tag}:</span>
            <span>{currentChapter.description}</span>
          </div>

          <div className="text-[10px] text-[#71717a] uppercase tracking-wider">
            Continuous Live Loop
          </div>
        </div>
      </div>
    </div>
  );
};
