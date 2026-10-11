import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  Terminal, 
  Send, 
  Check, 
  Copy, 
  Zap, 
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ProviderId = 'stripe' | 'github' | 'clerk' | 'shopify';

interface StepData {
  id: number;
  label: string;
  shortTag: string;
  title: string;
  description: string;
}

const STEPS: StepData[] = [
  {
    id: 1,
    label: '01 / Ingestion',
    shortTag: 'INGRESS',
    title: 'Sub-15ms WebSocket Broadcast',
    description: 'Incoming webhook captured from public edge tunnel and pushed into the local developer stream.'
  },
  {
    id: 2,
    label: '02 / HMAC Trace',
    shortTag: 'HMAC TRACE',
    title: 'Cryptographic Signature Verification',
    description: 'Header timestamps parsed, HMAC SHA-256 computed against local secret, and timingSafeEqual verified.'
  },
  {
    id: 3,
    label: '03 / Synthesizer',
    shortTag: 'SYNTH',
    title: 'Instant Schema & Type Generation',
    description: 'Local AST parsers infer strict TypeScript types and Zod schemas directly from payload keys in < 0.3s.'
  },
  {
    id: 4,
    label: '04 / Replay',
    shortTag: 'REPLAY',
    title: '1-Click Localhost Forwarding',
    description: 'Replay payloads directly to your local server (localhost:3000) with complete header preservation.'
  }
];

const PROVIDERS = {
  stripe: {
    name: 'Stripe',
    endpoint: '/hook/ep_stripe_live',
    event: 'payment_intent.succeeded',
    sigHeader: 'stripe-signature: t=1700000000,v1=55dd8cc8e920fa1...',
    secret: 'whsec_99af2817c09e...',
    latency: '8.4ms',
    payload: {
      id: 'evt_3Msw24LkdIwHu7ix',
      object: 'event',
      type: 'payment_intent.succeeded',
      created: 1700000000,
      data: {
        object: {
          id: 'pi_3Msw24LkdIwHu7ix01',
          amount: 8900,
          currency: 'usd',
          status: 'succeeded',
          customer: 'cus_N83xKa092'
        }
      }
    },
    traceLogs: [
      { tag: 'HMAC', text: 'Inspecting signature header: stripe-signature', time: '+0.01ms' },
      { tag: 'TIME', text: 'Tolerance timestamp: t=1700000000 (delta: 1.2s < 300s)', time: '+0.02ms' },
      { tag: 'HASH', text: 'Computed HMAC-SHA256: 55dd8cc8e920fa143a... matches v1', time: '+0.04ms' },
      { tag: 'SAFE', text: 'crypto.timingSafeEqual(computed, received) => PASSED', time: '+0.05ms' }
    ],
    tsCode: `export interface StripePaymentIntentSucceeded {
  id: string;
  type: "payment_intent.succeeded";
  created: number;
  data: {
    object: {
      id: string;
      amount: number;
      currency: "usd";
      status: "succeeded";
      customer: string;
    };
  };
}`,
    zodCode: `import { z } from "zod";

export const StripePaymentIntentSchema = z.object({
  id: z.string().startsWith("evt_"),
  type: z.literal("payment_intent.succeeded"),
  created: z.number().int(),
  data: z.object({
    object: z.object({
      id: z.string().startsWith("pi_"),
      amount: z.number().positive(),
      currency: z.literal("usd"),
      status: z.literal("succeeded"),
      customer: z.string(),
    }),
  }),
});`
  },
  github: {
    name: 'GitHub',
    endpoint: '/hook/ep_github_ci',
    event: 'push',
    sigHeader: 'x-hub-signature-256: sha256=72ec78b82...',
    secret: 'gh_webhook_sec_890...',
    latency: '11.2ms',
    payload: {
      ref: 'refs/heads/main',
      before: '6113728f274312',
      after: '0d1a26ec6632c8',
      repository: {
        name: 'HookFlow',
        full_name: 'dev/HookFlow',
        private: true
      },
      commits: [
        {
          id: '0d1a26e',
          message: 'feat: timingSafeEqual signature trace',
          author: { name: 'Dhanush', email: 'dev@hookflow.io' }
        }
      ]
    },
    traceLogs: [
      { tag: 'HMAC', text: 'Inspecting signature header: x-hub-signature-256', time: '+0.01ms' },
      { tag: 'ALGO', text: 'Algorithm sha256 payload prefix detected', time: '+0.02ms' },
      { tag: 'HASH', text: 'Calculated raw hex digest matches signature prefix', time: '+0.03ms' },
      { tag: 'SAFE', text: 'crypto.timingSafeEqual verification: OK', time: '+0.04ms' }
    ],
    tsCode: `export interface GitHubPushEvent {
  ref: string;
  before: string;
  after: string;
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
    zodCode: `import { z } from "zod";

export const GitHubPushEventSchema = z.object({
  ref: z.string(),
  before: z.string(),
  after: z.string(),
  repository: z.object({
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
  }),
  commits: z.array(z.object({
    id: z.string(),
    message: z.string(),
    author: z.object({ name: z.string(), email: z.string().email() })
  })),
});`
  },
  clerk: {
    name: 'Clerk',
    endpoint: '/hook/ep_clerk_auth',
    event: 'user.created',
    sigHeader: 'svix-signature: v1,dK92x8Ll3mP90q...',
    secret: 'whsec_clerk_k9120...',
    latency: '9.6ms',
    payload: {
      data: {
        id: 'user_2NX68z99ak01',
        first_name: 'Elena',
        last_name: 'Vance',
        email_addresses: [
          { email_address: 'elena@workstation.internal', id: 'idn_9281a' }
        ]
      },
      object: 'event',
      type: 'user.created'
    },
    traceLogs: [
      { tag: 'SVIX', text: 'Validating Svix webhook headers: svix-id, svix-timestamp', time: '+0.01ms' },
      { tag: 'TIME', text: 'svix-timestamp verified within tolerance delta', time: '+0.02ms' },
      { tag: 'HASH', text: 'Svix v1 base64 secret signature matched', time: '+0.04ms' },
      { tag: 'SAFE', text: 'timingSafeEqual buffer match verified', time: '+0.05ms' }
    ],
    tsCode: `export interface ClerkUserCreatedEvent {
  object: "event";
  type: "user.created";
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email_addresses: Array<{
      id: string;
      email_address: string;
    }>;
  };
}`,
    zodCode: `import { z } from "zod";

export const ClerkUserCreatedSchema = z.object({
  object: z.literal("event"),
  type: z.literal("user.created"),
  data: z.object({
    id: z.string().startsWith("user_"),
    first_name: z.string(),
    last_name: z.string(),
    email_addresses: z.array(z.object({
      id: z.string(),
      email_address: z.string().email(),
    })),
  }),
});`
  },
  shopify: {
    name: 'Shopify',
    endpoint: '/hook/ep_shopify_store',
    event: 'orders/create',
    sigHeader: 'x-shopify-hmac-sha256: kL99x19082mK9...',
    secret: 'shpss_88a9120...',
    latency: '10.1ms',
    payload: {
      id: 820982911,
      email: 'alex@workstation.io',
      currency: 'USD',
      total_price: '349.00',
      line_items: [
        { title: 'Keyboard Kit', price: '349.00', quantity: 1 }
      ]
    },
    traceLogs: [
      { tag: 'HMAC', text: 'Inspecting x-shopify-hmac-sha256 header', time: '+0.01ms' },
      { tag: 'HASH', text: 'Base64 digest computed over raw request body', time: '+0.03ms' },
      { tag: 'SAFE', text: 'crypto.timingSafeEqual comparison: VERIFIED', time: '+0.04ms' }
    ],
    tsCode: `export interface ShopifyOrderCreated {
  id: number;
  email: string;
  currency: string;
  total_price: string;
  line_items: Array<{
    title: string;
    price: string;
    quantity: number;
  }>;
}`,
    zodCode: `import { z } from "zod";

export const ShopifyOrderSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  currency: z.string().length(3),
  total_price: z.string(),
  line_items: z.array(z.object({
    title: z.string(),
    price: z.string(),
    quantity: z.number().int().positive(),
  })),
});`
  }
};

export const LiveTraceSimulator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [provider, setProvider] = useState<ProviderId>('stripe');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed] = useState<number>(2800);
  const [schemaMode, setSchemaMode] = useState<'ts' | 'zod'>('ts');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [replayedCount, setReplayedCount] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeProvider = PROVIDERS[provider];
  const activeStep = STEPS[currentStep - 1];

  // Auto-simulation video playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentStep(prev => (prev >= 4 ? 1 : prev + 1));
    }, playbackSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setIsPlaying(true);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto rounded-lg border border-[#222222] bg-black overflow-hidden font-mono ${className}`}>
      
      {/* ── TOP WINDOW CHROME (Pure Black Developer Aesthetic) ─────────────── */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-[#222222] bg-[#0a0a0a] select-none gap-3">
        {/* Window controls & session breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#71717a]">
            <span className="text-[#e4e4e7] font-medium">trace</span>
            <span className="text-[#333333]">/</span>
            <span className="text-[#a1a1aa] truncate max-w-[140px] sm:max-w-none">{activeProvider.endpoint}</span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-[#121212] border border-[#222222] text-[#4ade80]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
            <span>{activeProvider.latency} ws</span>
          </span>
        </div>

        {/* Playback controls & provider switcher */}
        <div className="flex items-center gap-2">
          {/* Provider selector */}
          <div className="flex items-center bg-[#121212] border border-[#222222] rounded p-0.5 text-[10px]">
            {(['stripe', 'github', 'clerk', 'shopify'] as ProviderId[]).map(p => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`px-2.5 py-1 rounded transition-colors uppercase font-medium ${
                  provider === p
                    ? 'bg-black text-white border border-[#333333]'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Play/Pause toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              isPlaying
                ? 'bg-[#181818] border-[#333333] text-white'
                : 'bg-[#121212] border-[#222222] text-[#71717a] hover:text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Auto-play</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={handleRestart}
            className="p-1 rounded bg-[#121212] border border-[#222222] text-[#71717a] hover:text-white transition-colors"
            title="Reset step 01"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── STEP PROGRESSION TRACK (01, 02, 03, 04) ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#222222] bg-[#050505] divide-x divide-[#222222]">
        {STEPS.map(step => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={`text-left p-3 transition-colors relative group ${
                isActive
                  ? 'bg-[#0d0d0d]'
                  : 'hover:bg-[#080808]'
              }`}
            >
              {/* Active step indicator line */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white" />
              )}

              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-medium uppercase tracking-wider ${
                  isActive ? 'text-white' : isDone ? 'text-[#4ade80]' : 'text-[#52525b]'
                }`}>
                  {step.label}
                </span>
                {isDone ? (
                  <Check className="w-3 h-3 text-[#4ade80]" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-[#27272a]'}`} />
                )}
              </div>

              <div className={`text-xs font-medium truncate ${
                isActive ? 'text-white' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
              }`}>
                {step.shortTag}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── WORKSPACE SCREEN ──────────────────────────────────────────────── */}
      <div className="p-5 md:p-6 bg-black">
        {/* Step header with stable minimum height */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1f1f1f] min-h-[52px]">
          <div>
            <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2">
              <span>{activeStep.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-[#121212] border border-[#222222] text-[#a1a1aa]">
                {activeProvider.name}
              </span>
            </h3>
            <p className="text-xs text-[#71717a] mt-0.5 leading-relaxed max-w-2xl">
              {activeStep.description}
            </p>
          </div>

          <div className="text-right text-[11px] font-mono text-[#52525b] hidden sm:block">
            {currentStep} / 4
          </div>
        </div>

        {/* Dynamic Step View Content with rock-solid stable height */}
        <div className="min-h-[305px] flex flex-col justify-start">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: INGESTION / WEBSOCKET STREAM ── */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4"
              >
                {/* Event header & metadata */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="rounded-md border border-[#222222] bg-[#0a0a0a] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#71717a]">HTTP Method</span>
                      <span className="font-semibold text-white bg-[#141414] border border-[#27272a] px-2 py-0.5 rounded">
                        POST 200 OK
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#71717a]">Event Type</span>
                      <span className="text-[#e4e4e7]">{activeProvider.event}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#71717a]">Ingress Latency</span>
                      <span className="text-[#4ade80]">{activeProvider.latency}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#71717a]">WebSocket Push</span>
                      <span className="text-white flex items-center gap-1 font-medium">
                        <Zap className="w-3 h-3 text-[#71717a]" /> sub-15ms broadcast
                      </span>
                    </div>
                  </div>

                  {/* Raw signature header box */}
                  <div className="rounded-md border border-[#222222] bg-[#0a0a0a] p-3">
                    <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1 font-medium">
                      Inbound Signature Header
                    </div>
                    <div className="text-xs text-[#a1a1aa] font-mono truncate bg-[#121212] p-2 rounded border border-[#1f1f1f]">
                      {activeProvider.sigHeader}
                    </div>
                  </div>
                </div>

                {/* JSON payload window */}
                <div className="lg:col-span-7 rounded-md border border-[#222222] bg-[#0a0a0a] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#222222] bg-[#121212] text-xs text-[#71717a]">
                    <span>payload.json</span>
                    <span className="text-[10px] text-[#52525b]">application/json</span>
                  </div>
                  <div className="p-3.5 text-xs text-[#d4d4d8] overflow-y-auto h-[200px] bg-black">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(activeProvider.payload, null, 2)}</pre>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: CRYPTOGRAPHIC HMAC SIGNATURE TRACE ── */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* TimingSafe Trace Breakdown */}
              <div className="rounded-md border border-[#222222] bg-[#0a0a0a] p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222222]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                    <span className="text-xs font-semibold text-white">HMAC SHA-256 Pipeline</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#052e16] border border-[#14532d] text-[#4ade80]">
                    PASS · 0.04ms
                  </span>
                </div>

                <div className="space-y-2">
                  {activeProvider.traceLogs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1.5 px-3 rounded bg-black border border-[#1f1f1f]"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#141414] text-[#a1a1aa] border border-[#27272a]">
                          {log.tag}
                        </span>
                        <span className="text-[#d4d4d8] truncate">{log.text}</span>
                      </div>
                      <span className="text-[10px] text-[#4ade80] font-mono tabular-nums ml-2 shrink-0">
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code comparison callout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-md border border-[#222222] bg-[#0a0a0a]">
                  <span className="text-[10px] text-[#52525b] uppercase font-medium">Signing Secret</span>
                  <div className="mt-1 font-mono text-[#e4e4e7] truncate bg-black p-2 rounded border border-[#1f1f1f]">
                    {activeProvider.secret}
                  </div>
                </div>

                <div className="p-3 rounded-md border border-[#222222] bg-[#0a0a0a]">
                  <span className="text-[10px] text-[#52525b] uppercase font-medium">Verification Method</span>
                  <div className="mt-1 font-mono text-[#4ade80] truncate bg-black p-2 rounded border border-[#1f1f1f]">
                    crypto.timingSafeEqual(computed, received)
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: AI SCHEMA SYNTHESIZER ── */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#71717a]">Target:</span>
                  <div className="flex items-center bg-[#121212] border border-[#222222] rounded p-0.5 text-xs">
                    <button
                      onClick={() => setSchemaMode('ts')}
                      className={`px-3 py-1 rounded transition-colors text-[11px] font-medium ${
                        schemaMode === 'ts'
                          ? 'bg-black text-white border border-[#333333]'
                          : 'text-[#71717a] hover:text-white'
                      }`}
                    >
                      TypeScript
                    </button>
                    <button
                      onClick={() => setSchemaMode('zod')}
                      className={`px-3 py-1 rounded transition-colors text-[11px] font-medium ${
                        schemaMode === 'zod'
                          ? 'bg-black text-white border border-[#333333]'
                          : 'text-[#71717a] hover:text-white'
                      }`}
                    >
                      Zod Schema
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCode(schemaMode === 'ts' ? activeProvider.tsCode : activeProvider.zodCode)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs bg-[#121212] border border-[#222222] text-[#a1a1aa] hover:text-white transition-colors"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                      <span className="text-[#4ade80]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code viewer */}
              <div className="rounded-md border border-[#222222] bg-black overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#222222] bg-[#0a0a0a] text-xs text-[#71717a]">
                  <span className="text-white font-medium">
                    {schemaMode === 'ts' ? 'types/webhook.ts' : 'schemas/webhook.schema.ts'}
                  </span>
                  <span className="text-[10px] text-[#52525b]">inferred in 0.28s</span>
                </div>
                <div className="p-4 text-xs font-mono text-[#e4e4e7] bg-black overflow-x-auto h-[200px] overflow-y-auto leading-relaxed">
                  <pre className="whitespace-pre">
                    {schemaMode === 'ts' ? activeProvider.tsCode : activeProvider.zodCode}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: 1-CLICK LOCALHOST REPLAY ── */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="rounded-md border border-[#222222] bg-[#0a0a0a] p-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#71717a]" />
                    <span className="text-xs font-semibold text-white">Local Server Dispatch</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#052e16] border border-[#14532d] text-[#4ade80]">
                    200 OK · 11MS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8 flex items-center gap-2 bg-black border border-[#222222] rounded px-3 py-2 text-xs">
                    <span className="text-[#a1a1aa] font-semibold">POST</span>
                    <span className="text-[#e4e4e7] font-mono truncate">http://localhost:3000/api/webhooks/{provider}</span>
                  </div>

                  <div className="md:col-span-4">
                    <button
                      onClick={() => setReplayedCount(c => c + 1)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replay Payload</span>
                    </button>
                  </div>
                </div>

                {/* Simulated round-trip diagnostics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded bg-black border border-[#222222] text-center">
                    <div className="text-[10px] text-[#52525b] uppercase font-medium">Dev Server</div>
                    <div className="text-sm font-semibold text-[#4ade80] mt-0.5">200 OK</div>
                  </div>

                  <div className="p-3 rounded bg-black border border-[#222222] text-center">
                    <div className="text-[10px] text-[#52525b] uppercase font-medium">Latency</div>
                    <div className="text-sm font-semibold text-white mt-0.5">11.4 ms</div>
                  </div>

                  <div className="p-3 rounded bg-black border border-[#222222] text-center">
                    <div className="text-[10px] text-[#52525b] uppercase font-medium">Replays Sent</div>
                    <div className="text-sm font-semibold text-white mt-0.5">{replayedCount}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* ── FOOTER STEP NAVIGATOR ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#1f1f1f] text-xs">
          <div className="flex items-center gap-2 text-[#71717a]">
            <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
            <span className="text-[11px]">Ready to capture incoming webhooks</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(prev => (prev > 1 ? prev - 1 : 4))}
              className="px-2.5 py-1 rounded bg-[#121212] border border-[#222222] text-[#71717a] hover:text-white transition-colors text-[11px]"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(prev => (prev < 4 ? prev + 1 : 1))}
              className="flex items-center gap-1 px-3 py-1 rounded bg-white text-black hover:bg-neutral-200 transition-colors text-[11px] font-semibold"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
