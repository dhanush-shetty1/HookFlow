import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, Zap, Sparkles, Copy, Check,
  Radio, Lock, Cpu, RefreshCw, Globe, Activity,
  Database, Webhook, Layers,
} from 'lucide-react';
import { Spotlight } from './ui/Spotlight';
import { BorderBeam } from './ui/BorderBeam';
import { ShimmerButton } from './ui/ShimmerButton';
import { GlowingBadge } from './ui/GlowingBadge';
import { FeatureCard } from './ui/FeatureCard';
import { CodeBlock } from './ui/CodeBlock';
import { Badge } from './ui/Badge';
import { TerminalWindow } from './ui/TerminalWindow';

/* ─── Scroll-reveal wrapper ───────────────────────────────────────────── */
const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Architecture flow nodes ─────────────────────────────────────────── */
const ARCH_NODES = [
  {
    id: 'source', label: 'External Service', sublabel: 'Stripe / GitHub / Shopify',
    icon: Globe, color: 'text-zinc-400', bg: 'bg-zinc-900', border: 'border-zinc-700',
    desc: 'Any service that sends HTTP POST webhooks — Stripe, GitHub, Shopify, Clerk, or your own app.',
  },
  {
    id: 'ingest', label: 'Ingestion Endpoint', sublabel: 'POST /hook/:endpointId',
    icon: Webhook, color: 'text-sky-400', bg: 'bg-sky-950/30', border: 'border-sky-800/50',
    desc: 'Express route captures the raw HTTP request buffer preserving exact byte content for HMAC computation.',
  },
  {
    id: 'verify', label: 'HMAC Verifier', sublabel: 'crypto.timingSafeEqual',
    icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-800/50',
    desc: 'Timing-safe HMAC-SHA256 verification against your endpoint secret. Supports Stripe, GitHub, Shopify, and Clerk.',
  },
  {
    id: 'ws', label: 'WebSocket Bus', sublabel: 'ws://localhost:4000',
    icon: Zap, color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-800/50',
    desc: 'Native WebSocket server broadcasts each incoming event to all connected dashboard clients in under 15ms.',
  },
  {
    id: 'dashboard', label: 'React Dashboard', sublabel: 'localhost:3000',
    icon: Layers, color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-800/50',
    desc: 'Real-time dashboard with event stream, signature inspector, AI schema synthesizer, and 1-click replayer.',
  },
];

/* ─── Synthesized code output ─────────────────────────────────────────── */
type ProviderKey = 'stripe' | 'github' | 'shopify';
type SchemaKey = 'typescript' | 'zod' | 'nextjs';

const SAMPLE_JSON: Record<ProviderKey, string> = {
  stripe: JSON.stringify({ id: 'evt_3N8xyz', type: 'payment_intent.succeeded', amount: 4999, currency: 'usd', status: 'succeeded', customer: { id: 'cus_P92k', email: 'alex@acme.com', name: 'Alex Rivera' } }, null, 2),
  github: JSON.stringify({ ref: 'refs/heads/main', repository: { name: 'HookFlow', full_name: 'dev/HookFlow', private: false }, commits: [{ id: '0d1a26e', message: 'feat: AI synthesizer', author: { name: 'Dev', email: 'dev@acme.com' } }] }, null, 2),
  shopify: JSON.stringify({ id: 820982911, email: 'buyer@email.com', currency: 'USD', total_price: '249.00', financial_status: 'paid', line_items: [{ id: 703073, title: 'Mechanical Keyboard', price: '249.00', quantity: 1 }] }, null, 2),
};

const SYNTHESIZED: Record<ProviderKey, Record<SchemaKey, string>> = {
  stripe: {
    typescript: `export interface StripePaymentPayload {
  id: string;
  type: "payment_intent.succeeded";
  amount: number;
  currency: string;
  status: "succeeded" | "pending";
  customer: {
    id: string;
    email: string;
    name: string;
  };
}`,
    zod: `import { z } from 'zod';

export const StripePaymentSchema = z.object({
  id: z.string(),
  type: z.literal('payment_intent.succeeded'),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  status: z.enum(['succeeded', 'pending']),
  customer: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
});`,
    nextjs: `// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(
    body, sig, process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    console.log('Payment succeeded:', intent.id);
  }

  return NextResponse.json({ received: true });
}`,
  },
  github: {
    typescript: `export interface GitHubPushPayload {
  ref: string;
  repository: {
    name: string;
    full_name: string;
    private: boolean;
  };
  commits: Array<{
    id: string;
    message: string;
    author: { name: string; email: string };
  }>;
}`,
    zod: `import { z } from 'zod';

export const GitHubPushSchema = z.object({
  ref: z.string(),
  repository: z.object({
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
  }),
  commits: z.array(z.object({
    id: z.string(),
    message: z.string(),
    author: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  })),
});`,
    nextjs: `// app/api/webhooks/github/route.ts
import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');

  const expected = 'sha256=' + createHmac('sha256',
    process.env.GITHUB_WEBHOOK_SECRET!)
    .update(rawBody).digest('hex');

  if (signature !== expected)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = JSON.parse(rawBody);
  console.log('Push to:', payload.ref);
  return NextResponse.json({ ok: true });
}`,
  },
  shopify: {
    typescript: `export interface ShopifyOrderPayload {
  id: number;
  email: string;
  currency: string;
  total_price: string;
  financial_status: string;
  line_items: Array<{
    id: number;
    title: string;
    price: string;
    quantity: number;
  }>;
}`,
    zod: `import { z } from 'zod';

export const ShopifyOrderSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  currency: z.string(),
  total_price: z.string(),
  financial_status: z.string(),
  line_items: z.array(z.object({
    id: z.number(),
    title: z.string(),
    price: z.string(),
    quantity: z.number().int().positive(),
  })),
});`,
    nextjs: `// app/api/webhooks/shopify/route.ts
import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get('x-shopify-hmac-sha256');

  const hash = createHmac('sha256',
    process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(rawBody, 'utf8').digest('base64');

  if (hmac !== hash)
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });

  const order = JSON.parse(rawBody);
  console.log('Order:', order.id, order.total_price);
  return NextResponse.json({ received: true });
}`,
  },
};

/* ─── Demo hero workbench data ────────────────────────────────────────── */
type DemoKey = 'stripe' | 'github' | 'clerk' | 'shopify';

const DEMO: Record<DemoKey, { sigHeader: string; payload: object; ts: string; zod: string; nextjs: string }> = {
  stripe: {
    sigHeader: 'stripe-signature: t=1700000000,v1=55dd8cc8…',
    payload: { id: 'evt_3N8xyz', type: 'payment_intent.succeeded', amount: 4999, currency: 'usd', status: 'succeeded', customer: { id: 'cus_P92k', email: 'alex@acme.com' } },
    ts: SYNTHESIZED.stripe.typescript,
    zod: SYNTHESIZED.stripe.zod,
    nextjs: SYNTHESIZED.stripe.nextjs,
  },
  github: {
    sigHeader: 'x-hub-signature-256: sha256=72ec78b8…',
    payload: { ref: 'refs/heads/main', repository: { name: 'HookFlow', full_name: 'dev/HookFlow' }, commits: [{ id: '0d1a26e', message: 'feat: AI synthesizer' }] },
    ts: SYNTHESIZED.github.typescript,
    zod: SYNTHESIZED.github.zod,
    nextjs: SYNTHESIZED.github.nextjs,
  },
  clerk: {
    sigHeader: 'svix-signature: v1,dK92x8Ll…',
    payload: { type: 'user.created', data: { id: 'user_2NX68z', first_name: 'Jane', last_name: 'Dev', email: 'jane@acme.io' } },
    ts: `export interface ClerkUserCreated {\n  type: "user.created";\n  data: {\n    id: string;\n    first_name: string;\n    last_name: string;\n    email: string;\n  };\n}`,
    zod: `const ClerkUserSchema = z.object({\n  type: z.literal('user.created'),\n  data: z.object({\n    id: z.string(),\n    first_name: z.string(),\n    last_name: z.string(),\n    email: z.string().email(),\n  }),\n});`,
    nextjs: `export async function POST(req: Request) {\n  const wh = new Webhook(process.env.CLERK_WH_SECRET!);\n  const h = await headers();\n  const evt = wh.verify(await req.text(), {\n    'svix-id': h.get('svix-id')!,\n    'svix-timestamp': h.get('svix-timestamp')!,\n    'svix-signature': h.get('svix-signature')!,\n  });\n  return Response.json({ ok: true });\n}`,
  },
  shopify: {
    sigHeader: 'x-shopify-hmac-sha256: kL99x1…',
    payload: { id: 820982911, email: 'buyer@email.com', currency: 'USD', total_price: '249.00', line_items: [{ title: 'Keyboard', price: '249.00' }] },
    ts: SYNTHESIZED.shopify.typescript,
    zod: SYNTHESIZED.shopify.zod,
    nextjs: SYNTHESIZED.shopify.nextjs,
  },
};

/* ─── Main Component ──────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [cmdCopied, setCmdCopied] = useState(false);

  // Hero workbench
  const [demoProvider, setDemoProvider] = useState<DemoKey>('stripe');
  const [demoSchema, setDemoSchema] = useState<'ts' | 'zod' | 'nextjs'>('ts');
  const [replayState, setReplayState] = useState<'idle' | 'sending' | 'success'>('idle');
  const [eventCount, setEventCount] = useState(4);

  // Architecture
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // AI Synthesizer demo
  const [synthProvider, setSynthProvider] = useState<ProviderKey>('stripe');
  const [synthSchema, setSynthSchema] = useState<SchemaKey>('typescript');
  const [customJson, setCustomJson] = useState(SAMPLE_JSON.stripe);

  const demo = DEMO[demoProvider];

  const copyCmd = () => {
    navigator.clipboard.writeText('npm run dev');
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
  };

  const simulateReplay = () => {
    if (replayState !== 'idle') return;
    setReplayState('sending');
    setTimeout(() => {
      setReplayState('success');
      setEventCount(c => c + 1);
      setTimeout(() => setReplayState('idle'), 2500);
    }, 650);
  };

  const handleSynthProvider = (p: ProviderKey) => {
    setSynthProvider(p);
    setCustomJson(SAMPLE_JSON[p]);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans relative overflow-x-hidden bg-noise scroll-smooth">
      {/* Calyx-style dark grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-white opacity-[0.035] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_30%,transparent_100%)]" />
      </div>
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-zinc-800/80 bg-[#030304]/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-tight text-zinc-100">Hookflow</span>
        </div>

        {/* Perfectly Center-Aligned Navigation Links */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8 text-xs font-mono text-zinc-400">
          <button onClick={() => scrollToSection('features')} className="hover:text-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer">
            <small className="text-zinc-600 font-bold">01</small>
            <b className="font-bold tracking-wider">FEATURES</b>
          </button>
          <button onClick={() => scrollToSection('architecture')} className="hover:text-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer">
            <small className="text-zinc-600 font-bold">02</small>
            <b className="font-bold tracking-wider">ARCHITECTURE</b>
          </button>
          <button onClick={() => scrollToSection('ai-synthesizer')} className="hover:text-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer">
            <small className="text-zinc-600 font-bold">03</small>
            <b className="font-bold tracking-wider">AI SYNTHESIZER</b>
          </button>
          <button onClick={() => scrollToSection('providers')} className="hover:text-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer">
            <small className="text-zinc-600 font-bold">04</small>
            <b className="font-bold tracking-wider">PROVIDERS</b>
          </button>
        </nav>

        {/* Industrial Cut Button */}
        <button
          onClick={() => navigate('/console')}
          className="cut-button bg-zinc-100 text-zinc-950 hover:bg-white font-mono font-semibold text-xs px-4 py-2 flex items-center gap-2 transition-all tracking-wider uppercase"
        >
          <span>OPEN CONSOLE</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 px-4 max-w-6xl mx-auto flex flex-col items-center text-center z-10">
        <div className="mb-6">
          <span className="section-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            REAL-TIME WEBHOOK PROXY · REPLAYER · AI SYNTHESIZER
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
          className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05] mb-6 max-w-4xl font-sans"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-500">
            DEBUG WEBHOOKS.
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-300 to-zinc-600">
            KNOW WHAT ARRIVED.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
          className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-mono"
        >
          OBSERVE · VERIFY · SYNTHESIZE · REPLAY
          <br />
          <span className="text-zinc-500 font-sans mt-1 inline-block">
            Sub-15ms WebSocket streaming, HMAC signature verification, and AI-powered Zod + TypeScript schema synthesis — running locally on your machine.
          </span>
        </motion.p>

        {/* CTA row — Calyx Cut Button */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={() => navigate('/console')}
            className="cut-button bg-zinc-100 text-zinc-950 hover:bg-white font-mono font-bold text-xs px-6 py-3 flex items-center gap-2 transition-all tracking-widest uppercase shadow-lg shadow-white/5"
          >
            <span>OPEN CONSOLE</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={copyCmd}
            className="flex items-center gap-2.5 bg-[#09090c] border border-zinc-800 hover:border-zinc-700 rounded-md px-4 py-2.5 text-xs font-mono text-zinc-400 transition-all hover:text-zinc-200 group"
          >
            <span className="text-zinc-600">$</span>
            <span>npm run dev</span>
            <span className="ml-1 text-zinc-600 group-hover:text-zinc-300 transition-colors">
              {cmdCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </span>
          </button>
        </motion.div>

        {/* ── Interactive Demo Workbench (Calyx Evidence Terminal style) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.35 }}
          className="w-full max-w-5xl rounded-xl border border-zinc-800 bg-[#08080a] shadow-2xl overflow-hidden text-left relative"
        >
          <BorderBeam size={300} duration={12} colorFrom="#ffffff" colorTo="#3f3f46" borderWidth={1} />

          {/* Window chrome */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#0c0c0e]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400">
                INCIDENT / HOOK-INGEST
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ● LIVE
              </span>
            </div>
            {/* Provider switcher */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded p-0.5">
              {(['stripe', 'github', 'clerk', 'shopify'] as DemoKey[]).map(p => (
                <button
                  key={p} onClick={() => setDemoProvider(p)}
                  className={`px-3 py-1 rounded text-[10px] font-mono uppercase transition-all ${
                    demoProvider === p ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >{p}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80">
            {/* Left: Payload */}
            <div className="lg:col-span-5 p-5 space-y-3 bg-[#08080a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="tag-observed px-2 py-0.5 text-[9px] rounded font-mono font-bold">OBSERVED</span>
                  <span className="text-[11px] font-mono text-zinc-400">/hook/ep_{demoProvider}</span>
                </div>
                <span className="tag-verified px-2 py-0.5 text-[9px] rounded font-mono font-bold">VERIFIED</span>
              </div>

              <div className="text-[10px] font-mono text-zinc-500 bg-[#0c0c0e] border border-zinc-800 rounded px-3 py-2 truncate">
                {demo.sigHeader}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={demoProvider}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                  className="bg-[#050507] border border-zinc-800/80 rounded-lg p-4 font-mono text-[10px] text-zinc-300 max-h-52 overflow-y-auto"
                >
                  <pre>{JSON.stringify(demo.payload, null, 2)}</pre>
                </motion.div>
              </AnimatePresence>

              {/* Live stream indicator */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <motion.span
                    className="absolute inset-0 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{eventCount} EVENTS INGESTED · WS://LOCALHOST:4000</span>
              </div>

              {/* Replay flow */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-500">FORWARD TO LOCALHOST:3000</span>
                  <button
                    onClick={simulateReplay}
                    disabled={replayState === 'sending'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono uppercase border transition-all ${
                      replayState === 'success' ? 'tag-verified' :
                      replayState === 'sending' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed' :
                      'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500'
                    }`}
                  >
                    {replayState === 'idle' && <><RefreshCw className="w-3 h-3" /> REPLAY</>}
                    {replayState === 'sending' && (
                      <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}><RefreshCw className="w-3 h-3" /></motion.span> SENDING…</>
                    )}
                    {replayState === 'success' && <><Check className="w-3 h-3" /> 200 OK · 11MS</>}
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-600">
                  <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-[#0c0c0e] uppercase">{demoProvider}</span>
                  <motion.div className="h-px flex-1 bg-zinc-800"
                    animate={replayState === 'sending' ? { opacity: [0.3, 1, 0.3] } : {}}
                    transition={{ duration: 0.4, repeat: Infinity }} />
                  <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-[#0c0c0e] text-zinc-400 font-bold">HOOKFLOW</span>
                  <motion.div className="h-px flex-1"
                    style={{ background: replayState === 'success' ? '#10b981' : '#27272a' }}
                    animate={replayState === 'sending' ? { opacity: [0.3, 1, 0.3] } : {}}
                    transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }} />
                  <span className={`px-1.5 py-0.5 rounded border font-bold transition-all ${
                    replayState === 'success' ? 'tag-verified' : 'border-zinc-800 bg-[#0c0c0e]'
                  }`}>
                    {replayState === 'success' ? '200 OK' : ':3000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Schema */}
            <div className="lg:col-span-7 p-5 flex flex-col space-y-3 bg-[#08080a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="tag-synthesized px-2 py-0.5 text-[9px] rounded font-mono font-bold">SYNTHESIZED</span>
                  <span className="text-xs font-mono text-zinc-500">&lt; 0.5s LATENCY</span>
                </div>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded p-0.5">
                  {(['ts', 'zod', 'nextjs'] as const).map(s => (
                    <button key={s} onClick={() => setDemoSchema(s)}
                      className={`px-3 py-1 rounded text-[10px] font-mono uppercase transition-all ${
                        demoSchema === s ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                      }`}>
                      {s === 'ts' ? 'TypeScript' : s === 'zod' ? 'Zod' : 'Next.js'}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${demoProvider}-${demoSchema}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-300 overflow-y-auto"
                  style={{ minHeight: '240px', maxHeight: '300px' }}
                >
                  <pre className="leading-relaxed whitespace-pre">
                    {demoSchema === 'ts' ? demo.ts : demoSchema === 'zod' ? demo.zod : demo.nextjs}
                  </pre>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── MANIFESTO (Calyx style) ───────────────────────────────────────── */}
      <section className="py-20 px-4 max-w-5xl mx-auto text-center border-t border-zinc-800/60 z-10 relative">
        <FadeUp>
          <span className="section-pill mb-6">WHY HOOKFLOW</span>
          <p className="text-xl sm:text-3xl font-medium tracking-tight text-zinc-300 leading-snug max-w-4xl mx-auto font-sans">
            Modern backend teams process webhooks in seconds. Debugging signature failures or payload schema mismatches can still take hours.{' '}
            <span className="text-white font-bold">
              HookFlow follows the evidence across headers and bodies, verifies HMAC secrets, and gives your team an instant path from incoming request to type-safe code.
            </span>
          </p>
        </FadeUp>
      </section>

      {/* ── SIGNAL BANNER (Calyx style) ─────────────────────────────────── */}
      <section className="py-12 border-y border-zinc-800/80 bg-[#060608]">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80">
          <div className="py-4 md:py-0 md:px-8 text-left">
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">01 / DISCOVERY</span>
            <h3 className="text-sm font-bold text-zinc-100 mt-1 mb-1">ONE TIMELINE</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Headers, bodies, signatures, and responses connected inside one durable live inspector stream.
            </p>
          </div>

          <div className="py-4 md:py-0 md:px-8 text-left">
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">02 / SECURITY</span>
            <span className="tag-verified px-2 py-0.5 text-[9px] rounded font-mono font-bold ml-2">SAFE ACTION</span>
            <h3 className="text-sm font-bold text-zinc-100 mt-1 mb-1">HMAC SHA-256 VERIFIED</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Cryptographic verification with timing-safe comparison prevents unauthorized test payloads.
            </p>
          </div>

          <div className="py-4 md:py-0 md:px-8 text-left">
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">03 / SYNTHESIS</span>
            <h3 className="text-sm font-bold text-zinc-100 mt-1 mb-1">ZERO MANUAL TYPES</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Gemini 2.5 Flash &amp; AST engines convert raw JSON into Zod &amp; TypeScript schemas in &lt; 0.5s.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID (Calyx Capability Deck - Equal Height & Checklists) ── */}
      <section id="features" className="py-24 px-4 max-w-6xl mx-auto scroll-mt-20">
        <FadeUp>
          <div className="mb-14">
            <span className="section-pill mb-3">PLATFORM CAPABILITIES</span>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
              Engineered for Modern Backend Workflows
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              A complete route from raw HTTP webhook signal to evidence-backed TypeScript & Zod schemas.
            </p>
          </div>
        </FadeUp>

        {/* 3x2 Equal Height Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          <FadeUp delay={0.05} className="h-full">
            <FeatureCard
              index="01"
              tag="EVENT BUS"
              accentColor="emerald"
              icon={<Zap className="w-4 h-4 text-emerald-400" />}
              title="Sub-15ms WebSocket Stream"
              description="Persistent WebSocket channel streams raw headers, query parameters, and JSON bodies."
              items={[
                "Sub-15ms push to dashboard",
                "Automatic ping/pong heartbeat",
                "Zero polling overhead"
              ]}
              meta="< 15ms LATENCY"
            />
          </FadeUp>

          <FadeUp delay={0.1} className="h-full">
            <FeatureCard
              index="02"
              tag="VERIFICATION"
              accentColor="blue"
              icon={<ShieldCheck className="w-4 h-4 text-sky-400" />}
              title="HMAC Signature Inspector"
              description="Timing-safe signature comparison for Stripe, GitHub, Shopify, and Clerk."
              items={[
                "crypto.timingSafeEqual check",
                "Header format breakdown",
                "Diagnostic failure hints"
              ]}
              meta="HMAC-SHA256"
            />
          </FadeUp>

          <FadeUp delay={0.15} className="h-full">
            <FeatureCard
              index="03"
              tag="AI ENGINE"
              accentColor="violet"
              icon={<Sparkles className="w-4 h-4 text-purple-400" />}
              title="AI Schema Synthesizer"
              description="Synthesize TypeScript interfaces, Zod schemas, and Next.js handlers in < 0.5s."
              items={[
                "Gemini 2.5 Flash LLM engine",
                "Offline AST fallback engine",
                "Zod & TypeScript export"
              ]}
              meta="GEMINI 2.5 + AST"
            />
          </FadeUp>

          <FadeUp delay={0.2} className="h-full">
            <FeatureCard
              index="04"
              tag="REPLAYER"
              accentColor="amber"
              icon={<RefreshCw className="w-4 h-4 text-amber-400" />}
              title="1-Click Localhost Replayer"
              description="Edit headers or body payload, then re-broadcast captured webhooks to local servers."
              items={[
                "Forward to localhost:3000",
                "Round-trip status & latency",
                "Payload mutation before send"
              ]}
              meta="LOCALHOST FORWARD"
            />
          </FadeUp>

          <FadeUp delay={0.25} className="h-full">
            <FeatureCard
              index="05"
              tag="PERSISTENCE"
              accentColor="rose"
              icon={<Activity className="w-4 h-4 text-rose-400" />}
              title="Persistent Event Timeline"
              description="Every incoming payload is stored locally with full headers and execution telemetry."
              items={[
                "Embedded JSON event store",
                "Instant search & status filter",
                "Full historical payload log"
              ]}
              meta="FILE-BACKED STORE"
            />
          </FadeUp>

          <FadeUp delay={0.3} className="h-full">
            <FeatureCard
              index="06"
              tag="ENDPOINTS"
              accentColor="cyan"
              icon={<Globe className="w-4 h-4 text-cyan-400" />}
              title="Dynamic Ingestion Tunnels"
              description="Instantly generate dynamic ingestion endpoints mapped to custom secrets and providers."
              meta="DYNAMIC TUNNELS"
              items={[
                "Unique /hook/:endpointId URLs",
                "Provider secret mapping",
                "Multi-inbox workspace"
              ]}
            />
          </FadeUp>
        </div>
      </section>

      {/* ── WORKFLOW CONTROL GRID (Calyx Safety Workflow style) ─────────── */}
      <section className="py-20 px-4 max-w-6xl mx-auto border-t border-zinc-800/60">
        <FadeUp>
          <div className="mb-12 text-left">
            <span className="section-pill mb-3">WORKFLOW CONTROL</span>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
              THE DEVELOPMENT LOOP
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              FOUR STEPS FROM INBOUND WEBHOOK TO PRODUCTION CODE.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-zinc-800 bg-[#08080a] text-left relative overflow-hidden group hover:border-zinc-600 transition-colors">
              <span className="font-mono text-xs font-bold text-zinc-600 mb-2 block">01 / CATCH</span>
              <h3 className="text-sm font-bold text-zinc-100 mb-1">INGEST PAYLOAD</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Raw HTTP POST request captured with exact byte preservation.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800 bg-[#08080a] text-left relative overflow-hidden group hover:border-zinc-600 transition-colors">
              <span className="font-mono text-xs font-bold text-emerald-500 mb-2 block">02 / VERIFY</span>
              <h3 className="text-sm font-bold text-zinc-100 mb-1">CHECK SIGNATURE</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                HMAC-SHA256 verified against provider secret.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800 bg-[#08080a] text-left relative overflow-hidden group hover:border-zinc-600 transition-colors">
              <span className="font-mono text-xs font-bold text-purple-400 mb-2 block">03 / SYNTHESIZE</span>
              <h3 className="text-sm font-bold text-zinc-100 mb-1">GENERATE SCHEMAS</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Zod & TypeScript types created automatically in &lt; 0.5s.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800 bg-[#08080a] text-left relative overflow-hidden group hover:border-zinc-600 transition-colors">
              <span className="font-mono text-xs font-bold text-amber-400 mb-2 block">04 / REPLAY</span>
              <h3 className="text-sm font-bold text-zinc-100 mb-1">FORWARD TO LOCAL</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                1-click re-broadcast to localhost:3000 with latency metrics.
              </p>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── ARCHITECTURE ─────────────────────────────────────────────────── */}
      <section id="architecture" className="py-24 px-4 max-w-6xl mx-auto border-t border-zinc-800/40 scroll-mt-20">
        <FadeUp>
          <div className="mb-14">
            <p className="text-[10px] font-mono text-zinc-700 mb-3 tracking-widest uppercase">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">System Architecture</h2>
            <p className="text-sm text-zinc-500 max-w-xl leading-relaxed">
              HookFlow acts as a local reverse proxy. Webhooks hit the ingestion server, get verified, stored, and broadcast to the dashboard in real-time — all on your machine. Click any step to learn more.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Clickable flow nodes */}
            <div className="space-y-3.5 flex flex-col justify-between">
              {ARCH_NODES.map((node, i) => (
                <div key={node.id} className="flex-1 flex flex-col justify-center">
                  <button
                    onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left group ${
                      activeNode === node.id
                        ? `${node.bg} ${node.border} shadow-[2px_2px_0_#09090b]`
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                      activeNode === node.id ? `${node.bg} ${node.border}` : 'bg-zinc-900 border-zinc-800 group-hover:border-zinc-700'
                    }`}>
                      <node.icon className={`w-4 h-4 ${node.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-zinc-200">{node.label}</div>
                      <div className="text-[10px] font-mono text-zinc-600 truncate">{node.sublabel}</div>
                    </div>
                    <Badge variant={activeNode === node.id ? 'success' : 'outline'} className="flex-shrink-0">
                      Step {i + 1}
                    </Badge>
                  </button>

                  {/* Expanded explanation */}
                  <AnimatePresence>
                    {activeNode === node.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-1 mt-1 px-4 py-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                          {node.desc}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Terminal log showing actual server output */}
            <TerminalWindow title="hookflow · server log" className="h-full min-h-[460px] flex flex-col justify-between">
              <div className="space-y-1.5 text-[11px] font-mono leading-relaxed p-1">
                <div className="text-zinc-700">$ <span className="text-zinc-400">npx tsx server/index.ts</span></div>
                <div className="text-zinc-700 mt-2">◇ injected env (0) from .env</div>
                <div className="text-zinc-600">[DB] Embedded JSON store ready</div>
                <div className="text-zinc-700 mt-1">═══════════════════════════════════</div>
                <div className="text-emerald-400 mt-1">✓ Server on http://localhost:<span className="text-emerald-300">4000</span></div>
                <div className="text-sky-400">✓ WebSocket on ws://localhost:<span className="text-sky-300">4000</span></div>
                <div className="text-zinc-500">✓ Ingestion: /hook/<span className="text-zinc-400">:endpointId</span></div>
                <div className="text-zinc-500">✓ Dashboard: http://localhost:<span className="text-zinc-400">3000</span></div>
                <div className="text-zinc-700 mt-1">═══════════════════════════════════</div>
                <div className="text-zinc-500 mt-2">[WS] Client connected 127.0.0.1</div>
                <div className="text-emerald-500">[HOOK] POST /hook/ep_stripe → <span className="text-emerald-400">verified</span></div>
                <div className="text-sky-500">[WS] NEW_EVENT → <span className="text-sky-400">1</span> client <span className="text-zinc-600">(8ms)</span></div>
                <div className="text-zinc-600">[DB] Event saved: evt_1788275651</div>
                <div className="text-purple-400">[AI] Schema synthesized in <span className="text-purple-300">0.3s</span></div>
                <div className="text-emerald-500">[REPLAY] → localhost:3000 <span className="text-emerald-400">200 OK</span> <span className="text-zinc-600">(11ms)</span></div>
                <div className="text-zinc-700 mt-2 flex items-center gap-1">
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >█</motion.span>
                </div>
              </div>
            </TerminalWindow>
          </div>
        </FadeUp>
      </section>

      {/* ── AI SYNTHESIZER ───────────────────────────────────────────────── */}
      <section id="ai-synthesizer" className="py-24 px-4 max-w-6xl mx-auto border-t border-zinc-800/40 scroll-mt-20">
        <FadeUp>
          <div className="mb-14">
            <p className="text-[10px] font-mono text-zinc-700 mb-3 tracking-widest uppercase">Built-in AI</p>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">AI Schema Synthesizer</h2>
            <p className="text-sm text-zinc-500 max-w-xl leading-relaxed">
              Paste any webhook JSON below. HookFlow generates production-ready TypeScript interfaces, Zod validation schemas, and Next.js App Router handlers.{' '}
              <span className="text-zinc-300">Gemini 2.5 Flash</span> when an API key is set — falls back to the offline AST engine instantly.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">JSON Payload</span>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                  {(['stripe', 'github', 'shopify'] as ProviderKey[]).map(p => (
                    <button key={p} onClick={() => handleSynthProvider(p)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono capitalize transition-all ${
                        synthProvider === p ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              <textarea
                value={customJson}
                onChange={e => setCustomJson(e.target.value)}
                className="w-full h-80 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-[11px] text-zinc-300 resize-none focus:outline-none focus:border-zinc-600 transition-colors leading-relaxed"
                spellCheck={false}
                placeholder="Paste any JSON webhook payload here…"
              />
              <div className="flex items-center gap-2 text-[10px] text-zinc-700">
                <Cpu className="w-3 h-3" />
                <span>Engine: Gemini 2.5 Flash → Offline AST fallback</span>
              </div>
            </div>

            {/* Output */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Generated Code</span>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                  {(['typescript', 'zod', 'nextjs'] as SchemaKey[]).map(s => (
                    <button key={s} onClick={() => setSynthSchema(s)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all ${
                        synthSchema === s ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
                      }`}>
                      {s === 'typescript' ? 'TypeScript' : s === 'zod' ? 'Zod Schema' : 'Next.js'}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${synthProvider}-${synthSchema}`}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                >
                  <CodeBlock
                    code={SYNTHESIZED[synthProvider]?.[synthSchema] ?? '// Select a provider above'}
                    className="h-80"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="success">Production-ready</Badge>
                <Badge variant="default">Type-safe</Badge>
                <Badge variant="outline">Copy &amp; paste</Badge>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── PROVIDERS ────────────────────────────────────────────────────── */}
      <section id="providers" className="py-20 px-4 max-w-6xl mx-auto border-t border-zinc-800/40 scroll-mt-20">
        <FadeUp>
          <div className="mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Supported Providers</h2>
            <p className="text-xs text-zinc-600">Pre-configured HMAC signing schemes and mock payloads for every major service.</p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Stripe', header: 'stripe-signature', algo: 'HMAC-SHA256 (t+v1)', dot: 'bg-emerald-400' },
              { name: 'GitHub', header: 'x-hub-signature-256', algo: 'HMAC-SHA256', dot: 'bg-sky-400' },
              { name: 'Shopify', header: 'x-shopify-hmac-sha256', algo: 'Base64 HMAC', dot: 'bg-purple-400' },
              { name: 'Clerk / Svix', header: 'svix-signature', algo: 'Base64 HMAC-SHA256', dot: 'bg-amber-400' },
              { name: 'Twilio', header: 'x-twilio-signature', algo: 'HMAC-SHA1', dot: 'bg-rose-400' },
              { name: 'Discord', header: 'x-signature-ed25519', algo: 'Ed25519', dot: 'bg-indigo-400' },
              { name: 'Slack', header: 'x-slack-signature', algo: 'v0=HMAC-SHA256', dot: 'bg-teal-400' },
              { name: 'Custom HMAC', header: 'x-signature', algo: 'Custom Secret', dot: 'bg-zinc-400' },
            ].map(item => (
              /* Neo-brutalism provider cards */
              <div
                key={item.name}
                className="p-4 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-900/80 transition-all duration-200 shadow-[2px_2px_0_#18181b] hover:shadow-[3px_3px_0_#27272a] hover:-translate-y-px cursor-default select-none"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                  <span className="font-semibold text-xs text-zinc-200">{item.name}</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-600 truncate">{item.header}</div>
                <div className="text-[10px] text-zinc-700 mt-0.5">{item.algo}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── FINAL CTA (Calyx style) ─────────────────────────────────────── */}
      <section className="py-24 px-4 max-w-5xl mx-auto border-t border-zinc-800/60 text-center relative z-10">
        <FadeUp>
          <span className="section-pill mb-6">READY FOR PRODUCTION</span>
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-4 uppercase font-sans">
            BE READY<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-300 to-zinc-600">
              BEFORE IMPACT.
            </span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Give every developer a clear path from inbound webhook signal to type-safe production code.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <button
              onClick={() => navigate('/console')}
              className="cut-button bg-zinc-100 text-zinc-950 hover:bg-white font-mono font-bold text-xs px-8 py-3.5 flex items-center gap-2 transition-all tracking-widest uppercase shadow-xl shadow-white/5"
            >
              <span>OPEN CONSOLE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Proof Badges (Calyx style) */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-mono text-zinc-500 font-bold border-t border-zinc-900 pt-8">
            <span className="flex items-center gap-2"><b className="text-zinc-300">01</b> EVIDENCE GROUNDED</span>
            <span className="flex items-center gap-2"><b className="text-zinc-300">02</b> HMAC VERIFIED</span>
            <span className="flex items-center gap-2"><b className="text-zinc-300">03</b> AI SYNTHESIZED</span>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER (Calyx style) ───────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 bg-[#020203] py-10 px-6 text-xs text-zinc-600 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-300 tracking-widest uppercase">HOOKFLOW</span>
          <span className="text-zinc-600">— REAL-TIME WEBHOOK PROXY &amp; REPLAYER</span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/console')} className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-bold">
            OPEN CONSOLE →
          </button>
        </div>
      </footer>
    </div>
  );
};
