# HookFlow — Complete Technical Architecture & Product Guide

- **Document Type:** System Architecture, Technology Breakdown & Developer Manual
- **Target Audience:** Software Engineers, System Architects, & Tech Lead Evaluators
- **Repository Mode:** Local Documentation (Not Pushed)

---

## 1. Executive Summary & Problem Statement

### 1.1 What is HookFlow?
**HookFlow** is an open-source, developer-first **Real-Time Webhook Proxy, Security Gateway, Event Replayer, and AI Schema Synthesizer**. It bridges the gap between external third-party services (Stripe, GitHub, Shopify, Clerk, Discord) and local or cloud application backends.

```
[ External Services ] ──(Raw Webhooks)──> [  H O O K F L O W  ]
  • Stripe                                  ├── HMAC-SHA256 Security Guard
  • GitHub                                  ├── Sub-15ms WebSocket Event Bus
  • Shopify                                 ├── Gemini 2.5 Flash AI Synthesizer
  • Clerk / Svix                            └── 1-Click Event Sandbox & Replayer
                                                         │
                                        ┌────────────────┴────────────────┐
                                        ▼                                 ▼
                             [ Web Console Dashboard ]          [ Local / Cloud Backend ]
```

---

### 1.2 The Problems HookFlow Solves

Traditionally, building and debugging webhook integrations in modern software development is painful, slow, and insecure:

| Problem | How Traditional Development Fails | How HookFlow Solves It |
|---|---|---|
| **Cloud-to-Local Tunnel Friction** | Developers must install, configure, and maintain external tunnel software (ngrok, Cloudflare) just to forward webhooks to their laptop. | **HookFlow LocalBridge™ (Zero-Tunnel Relay):** Delivers live cloud webhooks directly to `http://localhost:[PORT]` with browser-direct forwarding or a sub-15ms WebSocket daemon (`npx hookflow listen`). |
| **Security Risks & Spoofing** | Developers skip verifying HMAC signatures during local dev, leaving production APIs vulnerable to fake requests. | **Built-in HMAC Guard:** Automates timing-safe cryptographic verification (`crypto.timingSafeEqual`) for Stripe, GitHub, Shopify, and Clerk. |
| **Development Velocity (Re-triggering Pain)** | To test 1 line of code, developers must repeatedly make real Stripe purchases or push real commits to GitHub 50 times. | **1-Click Event Replayer:** Captures the raw HTTP byte payload once and lets developers replay it infinitely to local localhost or staging APIs. |
| **Lack of Runtime Type Safety** | 100-line JSON payloads from third parties can crash servers if unexpected null fields arrive (`TypeError: Cannot read properties of undefined`). | **AI Schema Synthesizer (Zod & TypeScript):** Uses Google Gemini 2.5 Flash AI to generate production-ready Zod schemas and TypeScript interfaces in 1 second. |
| **Lack of Real-Time Visibility** | Developers must wade through messy terminal logs to inspect headers and body payloads. | **Sub-15ms WebSocket Bus:** Streams incoming webhook payloads directly to an interactive dark-mode web dashboard in real time. |
| **Cloud & Deployment Friction** | Self-hosting webhook inspection tools often requires complex enterprise setups. | **Multi-Stage Docker & 1-Click Render Blueprint:** Runs locally or deploys to cloud hosts in 60 seconds. |

---

## 2. Complete Technology Stack & Tooling Breakdown

HookFlow is built using a modern, production-grade technology stack carefully chosen for performance, type safety, security, and developer ergonomics.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HOOKFLOW TOOLCHAIN                            │
├────────────────────────────────────────────────────────────────────────┤
│  Frontend Layer     │ React 19 + TypeScript + Vite + Tailwind CSS      │
│  UI Motion & Icons  │ Framer Motion + Lucide React                     │
│  Backend Engine     │ Node.js (ESM) + Express.js + CORS                │
│  Real-Time Gateway  │ Native WebSockets (`ws` library)                 │
│  Security Layer     │ Node.js `crypto` (HMAC-SHA256 & timingSafeEqual) │
│  AI Engine          │ Google Gemini 2.5 Flash (`@google/genai`)        │
│  Fallback Engine    │ Custom AST Offline Type Synthesizer              │
│  Data Storage       │ MongoDB Mongoose + High-Speed JSON Storage       │
│  Deployment         │ Docker (Multi-stage) + Render Blueprint          │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Node.js & Express.js (Backend Traffic Engine)
- **What it does:** Forms the core HTTP server running on port 4000. Express captures all incoming HTTP methods (`POST`, `GET`, `PUT`, `DELETE`).
- **Raw Body Preservation:** Standard Express parsers corrupt raw body strings when parsing JSON. HookFlow uses custom `express.json({ verify })` middleware to capture the exact, un-mutated raw byte buffer (`req.rawBody`). This is essential because cryptographic HMAC calculations fail if even a single whitespace or character is altered by a parser.

### 2.2 Zod (Runtime Schema Guard)
- **What it does:** Zod is a TypeScript-first schema declaration and validation library.
- **Why it's used in HookFlow:** While TypeScript types disappear at runtime during compilation, Zod schemas validate live incoming JSON objects at runtime. If a third-party webhook sends malformed data, Zod catches it instantly before application code crashes. HookFlow's AI engine automatically outputs Zod schemas for every received payload:

```typescript
import { z } from 'zod';

export const StripePaymentSchema = z.object({
  id: z.string(),
  type: z.literal('payment_intent.succeeded'),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  customer: z.object({
    id: z.string(),
    email: z.string().email(),
  }),
});

export type StripePayment = z.infer<typeof StripePaymentSchema>;
```

### 2.3 Cryptography & HMAC Signatures (Security Layer)
- **What it does:** Third-party providers sign every webhook payload using a secret key and a Hash-based Message Authentication Code (HMAC-SHA256).
- **How HookFlow uses it:** HookFlow uses Node's native `crypto` module to re-calculate the signature:
  - **Stripe:** `t=timestamp,v1=signature` header format.
  - **GitHub:** `x-hub-signature-256` SHA-256 header format.
  - **Shopify:** `x-shopify-hmac-sha256` Base64 header format.
  - **Clerk:** `svix-signature` header format.
- **Timing-Safe Comparison:** HookFlow uses `crypto.timingSafeEqual()` to prevent timing attacks (where attackers guess signatures byte-by-byte based on microsecond response differences).

### 2.4 WebSockets (`ws` Library — Sub-15ms Real-Time Bus)
- **What it does:** Maintains a persistent, two-way TCP connection between the Express backend server and all open web client dashboards.
- **How HookFlow uses it:** As soon as a webhook request hits the Express server, HookFlow broadcasts the event over the `ws` WebSocket gateway. The client dashboard updates live in less than 15 milliseconds without requiring HTTP polling or page refreshes.

### 2.5 Google Gemini 2.5 Flash AI (`@google/genai`)
- **What it does:** Google DeepMind's high-speed AI language model (`gemini-2.5-flash`).
- **How HookFlow uses it:** When a webhook is selected in the UI, HookFlow passes the raw JSON payload to Gemini 2.5 Flash. The AI analyzes the data structure, field names, and value types to generate:
  - Complete, production-grade TypeScript Interfaces.
  - Strict Zod Validation Schemas (with `.email()`, `.uuid()`, `.url()` constraints).
  - Python Pydantic V2 Models.
  - Go Structs.
  - Next.js App Router API Route Handlers complete with signature verification.

### 2.6 Offline AST Synthesizer (Zero-Dependency Fallback)
- **What it does:** A built-in, deterministic recursive Abstract Syntax Tree parser.
- **Why it's in HookFlow:** If no Gemini API Key is provided or if the internet connection is offline, HookFlow's offline AST synthesizer instantly generates TypeScript interfaces, Zod schemas, and Pydantic models with 0 ms latency and 100% offline reliability.

### 2.7 MongoDB Mongoose & Embedded JSON Storage
- **What it does:** Dual-layer database persistence.
- **How HookFlow uses it:**
  - **MongoDB Atlas / Local:** When a `MONGODB_URI` environment variable is present, HookFlow uses Mongoose to store endpoints, webhook events, forward responses, and settings.
  - **Embedded Storage:** If MongoDB is not connected, HookFlow automatically defaults to high-speed file storage (`.hookflow_data/db.json`), ensuring zero configuration overhead for local developers.

### 2.8 React 19, Vite, Tailwind CSS & Framer Motion (Frontend Layer)
- **What it does:** Provides the web dashboard interface.
- **Optimizations:** Uses hardware-accelerated CSS radial gradients (`transform-gpu will-change-transform`), zero-rerender mouse tracking for card spotlights, and optimized backdrop blurs for 60–120 FPS UI performance.

### 2.9 Docker & Render (Containerization & Cloud Infrastructure)
- **Multi-Stage Dockerfile:** Builds a small, isolated Node.js 20 Alpine production container (`docker build -t hookflow .`).
- **Render Blueprint (`render.yaml`):** Configures 1-click cloud deployment with environment variables (`PORT`, `MONGODB_URI`, `GEMINI_API_KEY`) and dynamic API/WebSocket URL resolution.

---

## 3. Step-by-Step Payload Lifecycle in HookFlow

```
[ External Service (e.g. Stripe) ]
                 │
                 │ 1. HTTP POST Request (Raw JSON + Signature Header)
                 ▼
[ Express Ingestion Handler: POST /hook/:endpointId ]
                 │
                 │ 2. Preserve raw body buffer (req.rawBody)
                 ▼
[ HMAC Security Verifier ] ─── Validates signature against endpoint secret
                 │
                 │ 3. Status: VERIFIED ✅ or FAILED ❌
                 ▼
[ Database Persistence ] ─── Save event to MongoDB / JSON File Storage
                 │
                 │ 4. Broadcast event payload over WebSocket (ws://)
                 ▼
[ Web Console Dashboard ] ─── Render live event in <15ms
                 │
                 │ 5. Trigger AI Synthesizer or Event Replayer
                 ▼
[ Developer Environment / Target Server ]
```

---

## 4. Summary of Developer Workflows

1. **Create Endpoint:** Generate a unique ingestion URL (`/hook/<id>`) and assign a secret key.
2. **Expose or Deploy:** Run locally with HookFlow LocalBridge™ or deploy live to Render.
3. **Inspect Real-Time Payload:** View incoming headers, method, status, and raw body in the web dashboard.
4. **Generate Production Code:** Copy AI-synthesized Zod schemas and Next.js handlers directly into your codebase.
5. **Replay Events:** Click Replay Webhook to test downstream local endpoints without needing to re-trigger external events.
