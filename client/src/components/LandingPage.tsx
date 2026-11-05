import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, Zap, Sparkles, Copy, Check,
  Lock, Cpu, RefreshCw, Globe, Activity,
  Database, Webhook, Layers, Terminal as TerminalIcon, Play
} from 'lucide-react';
import { BorderBeam } from './ui/BorderBeam';
import { FeatureCard } from './ui/FeatureCard';
import { CodeBlock } from './ui/CodeBlock';
import { Badge } from './ui/Badge';
import { TerminalWindow } from './ui/TerminalWindow';
import { LiveTraceSimulator } from './LiveTraceSimulator';
import { InteractiveFeatureGrid } from './InteractiveFeatureGrid';
import { InteractiveVideoWalkthrough } from './InteractiveVideoWalkthrough';
import { HeroQuickstartPill } from './HeroQuickstartPill';
import { ProviderLogoGrid } from './ProviderLogoGrid';

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
    icon: Globe, color: 'text-white', bg: 'bg-[#0a0a0a]', border: 'border-[#222222]',
    desc: 'Any service that sends HTTP POST webhooks — Stripe, GitHub, Shopify, Clerk, or your own application.',
  },
  {
    id: 'ingest', label: 'Ingestion Endpoint', sublabel: 'POST /hook/:endpointId',
    icon: Webhook, color: 'text-white', bg: 'bg-[#0a0a0a]', border: 'border-[#222222]',
    desc: 'Express route captures the raw HTTP request buffer preserving exact byte content for HMAC computation.',
  },
  {
    id: 'verify', label: 'HMAC Verifier', sublabel: 'crypto.timingSafeEqual',
    icon: ShieldCheck, color: 'text-[#4ade80]', bg: 'bg-[#0a0a0a]', border: 'border-[#222222]',
    desc: 'Timing-safe HMAC-SHA256 verification against your endpoint secret. Supports Stripe, GitHub, Shopify, and Clerk.',
  },
  {
    id: 'ws', label: 'WebSocket Bus', sublabel: 'ws://localhost:4000',
    icon: Zap, color: 'text-white', bg: 'bg-[#0a0a0a]', border: 'border-[#222222]',
    desc: 'Native WebSocket server broadcasts each incoming event to all connected dashboard clients in under 15ms.',
  },
  {
    id: 'dashboard', label: 'React Dashboard', sublabel: 'localhost:3000',
    icon: Layers, color: 'text-white', bg: 'bg-[#0a0a0a]', border: 'border-[#222222]',
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

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [cmdCopied, setCmdCopied] = useState(false);

  // Architecture
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // AI Synthesizer demo
  const [synthProvider, setSynthProvider] = useState<ProviderKey>('stripe');
  const [synthSchema, setSynthSchema] = useState<SchemaKey>('typescript');
  const [customJson, setCustomJson] = useState(SAMPLE_JSON.stripe);

  // Terminal state
  const [cliTab, setCliTab] = useState<'listen' | 'verify' | 'synth'>('listen');
  const [termMinimized, setTermMinimized] = useState(false);

  const copyCmd = () => {
    navigator.clipboard.writeText('npm run dev');
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
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
    <div className="min-h-screen bg-black text-[#e4e4e7] font-mono relative overflow-x-hidden scroll-smooth selection:bg-[#262626] selection:text-white">

      {/* ── FLOATING PILL NAVBAR (ELF-INSPIRED) ─────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
        <nav
          aria-label="Main"
          className="pointer-events-auto flex items-center justify-between transition-all duration-300 mt-2 sm:mt-3 h-[52px] sm:h-[56px] w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-5xl bg-black/85 backdrop-blur-md px-4 sm:px-6 text-white border border-[#222222] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.8)] select-none font-mono"
        >
          {/* Brand */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 font-bold text-sm tracking-tight text-white cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
            <span>HookFlow</span>
          </div>

          {/* Navigation Links */}
          <ul className="hidden md:flex items-center gap-1">
            <li>
              <button
                onClick={() => scrollToSection('live-tour')}
                className="rounded-full px-3.5 py-1.5 text-xs text-[#a1a1aa] transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Tour
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('providers')}
                className="rounded-full px-3.5 py-1.5 text-xs text-[#a1a1aa] transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Providers
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('features')}
                className="rounded-full px-3.5 py-1.5 text-xs text-[#a1a1aa] transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Features
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('cli')}
                className="rounded-full px-3.5 py-1.5 text-xs text-[#a1a1aa] transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                CLI
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('architecture')}
                className="rounded-full px-3.5 py-1.5 text-xs text-[#a1a1aa] transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Architecture
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('ai-synthesizer')}
                className="rounded-full px-3.5 py-1.5 text-xs text-[#a1a1aa] transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                Synthesizer
              </button>
            </li>
          </ul>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/console')}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-[0.98] bg-white text-black hover:bg-[#e4e4e7] flex items-center gap-1.5 shadow-sm"
            >
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO SECTION WITH ATMOSPHERIC BACKDROP ────────────────────────── */}
      <header className="relative pt-28 sm:pt-36 pb-20 px-4 text-center overflow-hidden min-h-[85vh] flex flex-col justify-center items-center">
        {/* Atmospheric Twilight Backdrop (Image 1 style with mask) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <img
            src="/images/twilight-backdrop.jpg"
            alt=""
            className="w-full h-full object-cover object-top opacity-25 mix-blend-screen mask-hero-fade filter brightness-90"
          />
          <div className="absolute inset-0 bg-radial-gradient opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111114]/90 backdrop-blur-md border border-[#27272a] text-[11px] font-mono text-[#a1a1aa] mb-6 shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
            <span>HookFlow v1.0 · Sub-15ms Local Webhook Proxy</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 text-white max-w-4xl"
          >
            Debug Webhooks.<br />
            <span className="text-[#71717a]">Know what arrived.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl mx-auto mb-8 leading-relaxed font-mono"
          >
            A self-hosted developer proxy for capturing raw webhook signals — sub-15ms WebSocket live streaming, cryptographic HMAC verification, and instant schema synthesis.
          </motion.p>

          {/* Elf-Style Quickstart Pill (Image 2 style) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full mb-8"
          >
            <HeroQuickstartPill />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => navigate('/console')}
              className="btn primary text-xs py-2 px-4 font-semibold shadow-md"
            >
              <span>Open Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={copyCmd}
              className="btn text-xs py-2 px-3.5"
              title="Copy local run command"
            >
              <span className="text-[#a1a1aa]">$</span>
              <span>npm run dev</span>
              <span className="ml-1 text-[#71717a]">
                {cmdCopied ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
              </span>
            </button>
          </motion.div>
        </div>
      </header>

      {/* ── AUTONOMOUS PRODUCT WALKTHROUGH & LIVE PIPELINE DISPLAY ────────── */}
      <section id="live-tour" className="py-20 px-4 max-w-6xl mx-auto scroll-mt-20">
        <FadeUp>
          <div className="text-center mb-10">
            <div className="eyebrow mb-2">01 / Pipeline Telemetry</div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Real-Time Webhook Lifecycle
            </h2>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl mx-auto leading-relaxed">
              Continuous demonstration of edge ingress, constant-time HMAC cryptographic verification, AST schema synthesis, and localhost replaying.
            </p>
          </div>

          {/* Autonomous Video Display without loader or switcher */}
          <div className="w-full relative">
            <InteractiveVideoWalkthrough />
          </div>
        </FadeUp>
      </section>

      {/* ── SUPPORTED PROVIDERS GRID (Image 1 6x2 layout) ──────────────────── */}
      <section id="providers" className="py-20 px-4 max-w-6xl mx-auto border-t border-[#222222] scroll-mt-20">
        <FadeUp>
          <ProviderLogoGrid />
        </FadeUp>
      </section>

      {/* ── DEVELOPER CLI & ORIGIN TERMINAL ──────────────────────────────── */}
      <section id="cli" className="py-16 px-4 max-w-4xl mx-auto text-center scroll-mt-20">
        <div className="eyebrow mb-2">Developer Tools</div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3">
          Local-First CLI & Ingestion Pipeline
        </h2>
        <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl mx-auto mb-6 leading-relaxed">
          Spin up local listeners, inspect HMAC signatures in real-time, or synthesize schemas directly from your terminal.
        </p>

        <div className="term">
          <div className="term-bar">
            <div className="flex items-center gap-2">
              <span className="ttl">hookflow-cli v1.0.0</span>
              <div className="flex items-center bg-[#0a0a0a] border border-[#222222] rounded p-0.5 ml-3">
                <button
                  onClick={() => setCliTab('listen')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    cliTab === 'listen' ? 'bg-white text-black font-semibold' : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  listen
                </button>
                <button
                  onClick={() => setCliTab('verify')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    cliTab === 'verify' ? 'bg-white text-black font-semibold' : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  verify
                </button>
                <button
                  onClick={() => setCliTab('synth')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    cliTab === 'synth' ? 'bg-white text-black font-semibold' : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  synth
                </button>
              </div>
            </div>
            <div className="winbtns">
              <span onClick={() => setTermMinimized(!termMinimized)} title="Toggle view">
                –
              </span>
            </div>
          </div>

          {!termMinimized && (
            <pre className="min-h-[115px]">
              {cliTab === 'listen' && (
                <>
                  <span className="cs">$</span> npx hookflow listen --port 4000 --tunnel<br />
                  <span className="cm">[INFO] Ingestion tunnel live at:</span> https://hookflow.local/hook/ep_dev<br />
                  <span className="cm">[INFO] WebSocket stream bound:</span> ws://localhost:4000<br />
                  <span className="text-[#4ade80]">✓ Ready to catch webhooks with sub-15ms broadcast</span>
                </>
              )}
              {cliTab === 'verify' && (
                <>
                  <span className="cs">$</span> npx hookflow verify --provider stripe --secret whsec_test<br />
                  <span className="cm">[HMAC] Inspecting stripe-signature header format...</span><br />
                  <span className="text-[#4ade80]">✓ Header matched: t=1700000000,v1=sha256...</span><br />
                  <span className="text-[#4ade80]">✓ timingSafeEqual check PASSED (0.04ms)</span>
                </>
              )}
              {cliTab === 'synth' && (
                <>
                  <span className="cs">$</span> npx hookflow synth --from ./payload.json --target zod<br />
                  <span className="cm">[AST] Ingested 18 JSON keys, inferred strict schema...</span><br />
                  <span className="text-white">export const WebhookEventSchema = z.object(&#123; ... &#125;);</span><br />
                  <span className="text-[#4ade80]">✓ Synthesized in 0.28s without manual typings</span>
                </>
              )}
            </pre>
          )}
        </div>
      </section>

      {/* ── SIGNAL BANNER ─────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-[#222222] bg-black">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#222222]">
          <div className="py-4 md:py-0 md:px-8 text-left">
            <span className="text-[11px] font-mono text-[#71717a] font-medium uppercase tracking-wider">01 / DISCOVERY</span>
            <h3 className="text-sm font-semibold text-white mt-1 mb-1">ONE TIMELINE</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed font-mono">
              Headers, bodies, signatures, and responses connected inside one durable live stream.
            </p>
          </div>

          <div className="py-4 md:py-0 md:px-8 text-left">
            <span className="text-[11px] font-mono text-[#71717a] font-medium uppercase tracking-wider">02 / SECURITY</span>
            <h3 className="text-sm font-semibold text-white mt-1 mb-1">HMAC SHA-256 VERIFIED</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed font-mono">
              Cryptographic verification with timingSafeEqual prevents spoofed payload bugs.
            </p>
          </div>

          <div className="py-4 md:py-0 md:px-8 text-left">
            <span className="text-[11px] font-mono text-[#71717a] font-medium uppercase tracking-wider">03 / SYNTHESIS</span>
            <h3 className="text-sm font-semibold text-white mt-1 mb-1">ZERO MANUAL TYPES</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed font-mono">
              AST engines generate Zod schemas and TypeScript interfaces in &lt; 0.3s.
            </p>
          </div>
        </div>
      </section>

      {/* ── PLATFORM CAPABILITIES (Features) ─────────────────────────────── */}
      <section id="features" className="py-24 px-4 max-w-6xl mx-auto scroll-mt-20 space-y-24">
        {/* Interactive 3-Card Showcase & How It Works */}
        <InteractiveFeatureGrid />

        <div>
          <FadeUp>
            <div className="text-center mb-14">
              <div className="text-[11px] text-[#71717a] font-mono tracking-wider uppercase mb-2">Platform Capabilities</div>
              <h2 className="text-xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
                Full-Stack Architecture & Tooling
              </h2>
              <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl mx-auto leading-relaxed">
                A complete route from raw inbound HTTP webhooks to evidence-backed TypeScript & Zod schemas.
              </p>
            </div>
          </FadeUp>

          {/* 3x2 Feature Card Deck */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FadeUp delay={0.05} className="h-full">
            <FeatureCard
              index="01"
              tag="EVENT BUS"
              icon={<Zap className="w-5 h-5 text-white" />}
              title="Sub-15ms WebSocket Stream"
              description="Persistent WebSocket channel streams raw headers, query parameters, and JSON bodies directly to your dashboard."
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
              icon={<ShieldCheck className="w-5 h-5 text-[#4ade80]" />}
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
              icon={<Sparkles className="w-5 h-5 text-white" />}
              title="AI Schema Synthesizer"
              description="Synthesize TypeScript interfaces, Zod schemas, and Next.js handlers in under 0.5s."
              items={[
                "Gemini Flash LLM engine",
                "Offline AST fallback engine",
                "Zod & TypeScript export"
              ]}
              meta="GEMINI + AST"
            />
          </FadeUp>

          <FadeUp delay={0.2} className="h-full">
            <FeatureCard
              index="04"
              tag="REPLAYER"
              icon={<RefreshCw className="w-5 h-5 text-[#fbbf24]" />}
              title="1-Click Localhost Replayer"
              description="Edit headers or body payload, then re-broadcast captured webhooks directly to local dev servers."
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
              icon={<Activity className="w-5 h-5 text-white" />}
              title="Persistent Event Timeline"
              description="Every incoming payload is stored locally in an embedded database with full headers and telemetry."
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
              tag="TUNNELS"
              icon={<Globe className="w-5 h-5 text-white" />}
              title="Dynamic Ingestion Tunnels"
              description="Instantly generate dynamic ingestion endpoints mapped to custom secrets and providers."
              items={[
                "Unique /hook/:endpointId URLs",
                "Provider secret mapping",
                "Multi-inbox workspace"
              ]}
              meta="DYNAMIC TUNNELS"
            />
          </FadeUp>
        </div>
        </div>
      </section>

      {/* ── ARCHITECTURE SECTION ─────────────────────────────────────────── */}
      <section id="architecture" className="py-24 px-4 max-w-6xl mx-auto border-t border-[#222222] scroll-mt-20">
        <FadeUp>
          <div className="mb-14">
            <div className="eyebrow mb-2">How It Works</div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">System Architecture</h2>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl leading-relaxed">
              HookFlow acts as a local reverse proxy. Webhooks hit the ingestion server, get verified, stored, and broadcast to the dashboard in real-time.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Clickable flow nodes */}
            <div className="space-y-3 flex flex-col justify-between">
              {ARCH_NODES.map((node, i) => (
                <div key={node.id} className="flex-1 flex flex-col justify-center">
                  <button
                    onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all duration-200 text-left ${
                      activeNode === node.id
                        ? 'bg-[#141414] border-white'
                        : 'bg-[#0a0a0a] border-[#222222] hover:border-[#444444]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 border border-[#222222] bg-black">
                      <node.icon className={`w-4 h-4 ${node.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white">{node.label}</div>
                      <div className="text-[11px] font-mono text-[#71717a] truncate">{node.sublabel}</div>
                    </div>
                    <Badge variant={activeNode === node.id ? 'default' : 'outline'} className="flex-shrink-0">
                      Step {i + 1}
                    </Badge>
                  </button>

                  <AnimatePresence>
                    {activeNode === node.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-1 mt-1 px-4 py-3 rounded-md bg-[#0a0a0a] border border-[#222222] text-xs text-[#a1a1aa] leading-relaxed">
                          {node.desc}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Terminal log */}
            <TerminalWindow title="hookflow-server.log" className="h-full min-h-[460px] flex flex-col justify-between">
              <div className="space-y-1 text-xs font-mono leading-relaxed p-1">
                <div className="text-[#a1a1aa]">$ <span className="text-white">npm run dev</span></div>
                <div className="text-[#71717a] mt-2">◇ loaded env from .env</div>
                <div className="text-[#71717a]">[DB] Embedded JSON store ready</div>
                <div className="text-[#222222] mt-1">───────────────────────────────────</div>
                <div className="text-[#4ade80] mt-1">✓ Server on http://localhost:<span className="text-white">4000</span></div>
                <div className="text-white">✓ WebSocket on ws://localhost:<span className="text-white">4000</span></div>
                <div className="text-[#a1a1aa]">✓ Ingestion: /hook/<span className="text-white">:endpointId</span></div>
                <div className="text-[#a1a1aa]">✓ Dashboard: http://localhost:<span className="text-white">3000</span></div>
                <div className="text-[#222222] mt-1">───────────────────────────────────</div>
                <div className="text-[#71717a] mt-2">[WS] Client connected 127.0.0.1</div>
                <div className="text-[#4ade80]">[HOOK] POST /hook/ep_stripe → verified (HMAC-SHA256)</div>
                <div className="text-white">[WS] NEW_EVENT → broadcasted (8ms)</div>
                <div className="text-[#71717a]">[DB] Event saved: evt_1788275651</div>
                <div className="text-[#a1a1aa]">[AI] Schema synthesized in 0.3s</div>
                <div className="text-[#4ade80]">[REPLAY] → localhost:3000 200 OK (11ms)</div>
                <div className="text-white mt-2 flex items-center gap-1">
                  <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    █
                  </motion.span>
                </div>
              </div>
            </TerminalWindow>
          </div>
        </FadeUp>
      </section>

      {/* ── AI SYNTHESIZER ───────────────────────────────────────────────── */}
      <section id="ai-synthesizer" className="py-24 px-4 max-w-6xl mx-auto border-t border-[#222222] scroll-mt-20">
        <FadeUp>
          <div className="mb-14">
            <div className="eyebrow mb-2">Automated Typings</div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">AI Schema Synthesizer</h2>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl leading-relaxed">
              Paste any webhook JSON below. HookFlow generates production-ready TypeScript interfaces, Zod validation schemas, and Next.js App Router handlers in seconds.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">JSON Payload</span>
                <div className="flex items-center bg-[#0a0a0a] border border-[#222222] rounded p-0.5 gap-1">
                  {(['stripe', 'github', 'shopify'] as ProviderKey[]).map(p => {
                    const isSelected = synthProvider === p;
                    const pColor = p === 'stripe' ? '#635bff' : p === 'github' ? '#a855f7' : '#95bf47';
                    return (
                      <button
                        key={p}
                        onClick={() => handleSynthProvider(p)}
                        className="px-2.5 py-1 rounded text-[10px] font-mono capitalize transition-all border"
                        style={{
                          color: isSelected ? '#ffffff' : '#71717a',
                          backgroundColor: isSelected ? `${pColor}25` : 'transparent',
                          borderColor: isSelected ? pColor : 'transparent',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                value={customJson}
                onChange={e => setCustomJson(e.target.value)}
                className="w-full h-80 rounded-lg border border-[#222222] bg-[#0a0a0a] p-4 font-mono text-xs text-[#e4e4e7] resize-none focus:outline-none focus:border-white transition-colors leading-relaxed selection:bg-[#262626]"
                spellCheck={false}
                placeholder="Paste any JSON webhook payload here…"
              />
              <div className="flex items-center gap-2 text-[11px] text-[#71717a]">
                <Cpu className="w-3.5 h-3.5 text-white" />
                <span>Engine: Gemini Flash → Offline AST fallback</span>
              </div>
            </div>

            {/* Output */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">Generated Code</span>
                <div className="flex items-center bg-[#0a0a0a] border border-[#222222] rounded p-0.5 gap-1">
                  {(['typescript', 'zod', 'nextjs'] as SchemaKey[]).map(s => {
                    const isSelected = synthSchema === s;
                    const sColor = s === 'typescript' ? '#38bdf8' : s === 'zod' ? '#818cf8' : '#ffffff';
                    return (
                      <button
                        key={s}
                        onClick={() => setSynthSchema(s)}
                        className="px-2.5 py-1 rounded text-[10px] font-mono transition-all border"
                        style={{
                          color: isSelected ? '#ffffff' : '#71717a',
                          backgroundColor: isSelected ? `${sColor}20` : 'transparent',
                          borderColor: isSelected ? sColor : 'transparent',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {s === 'typescript' ? 'TypeScript' : s === 'zod' ? 'Zod Schema' : 'Next.js'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${synthProvider}-${synthSchema}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <CodeBlock
                    code={SYNTHESIZED[synthProvider]?.[synthSchema] ?? '// Select a provider above'}
                    className="h-80"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">Production-ready</Badge>
                <Badge variant="outline">Type-safe</Badge>
                <Badge variant="outline">Copy &amp; paste</Badge>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── GET STARTED / CALL TO ACTION ─────────────────────────────────── */}
      <section id="start" className="py-24 px-4 max-w-4xl mx-auto border-t border-[#222222] text-center">
        <FadeUp>
          <div className="p-10 rounded-xl border border-[#222222] bg-[#0a0a0a] shadow-2xl">
            <div className="eyebrow mb-2">Ready to Deploy</div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Deploy HookFlow locally today.
            </h2>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-lg mx-auto mb-6 leading-relaxed">
              Open source, self-hosted, and free. No sales teams, no cloud locks, no telemetry.
            </p>

            <div className="codeblock max-w-md mx-auto">
              <span><span className="prompt">$</span> git clone https://github.com/hookflow/hookflow.git</span>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => navigate('/console')}
                className="btn primary text-sm py-2.5 px-6 font-bold"
              >
                <span>Launch Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-8 text-xs text-[#a1a1aa]">
              <span className="section-pill">Self-hosted</span>
              <span className="section-pill">Local-first</span>
              <span className="section-pill">HMAC-verified</span>
              <span className="section-pill">Zero telemetry</span>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#222222] bg-black py-8 px-6 text-xs text-[#71717a] max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-white tracking-wider">HOOKFLOW</span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/console')} className="text-[#a1a1aa] hover:text-white transition-colors flex items-center gap-1 font-medium">
            OPEN CONSOLE →
          </button>
        </div>
      </footer>
    </div>
  );
};
