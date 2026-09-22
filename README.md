# Hookflow

Local-first webhook proxy, HMAC verifier, event replayer, and schema synthesizer for backend development.

## Overview

Hookflow is an open-source local engine for capturing, inspecting, verifying, and replaying inbound HTTP webhooks. It streams incoming payloads to a web dashboard over WebSockets in real time and automatically generates TypeScript interfaces, Zod schemas, and route handlers.

## Core Features

- **Live WebSocket Event Stream**: Sub-15ms broadcast of raw request headers, query parameters, and JSON payloads.
- **HMAC Signature Verifiers**: Timing-safe verification using `crypto.timingSafeEqual` for Stripe, GitHub, Shopify, Clerk/Svix, Twilio, Discord, and Slack.
- **AI & AST Schema Synthesizer**: Converts raw JSON payloads into TypeScript interfaces, Zod validation schemas, and Next.js App Router handlers using Gemini 2.5 Flash with an automatic offline AST fallback.
- **Localhost Replayer**: Edit payloads or headers in the dashboard and re-broadcast events directly to your local development server (`http://localhost:3000`).
- **Flexible Storage**: Zero-dependency embedded JSON file storage (`.hookflow_data/store.json`) with optional MongoDB Atlas sync.

## Architecture

```
[External Webhook] → [Hookflow Server :4000] → [WebSocket Bus] → [React Console :3000]
                             │
                             └─► [HMAC Verifier] → [AI Synthesizer] → [Replay -> localhost:3000]
```

## Local Development

### Prerequisites

- Node.js v18+
- npm v9+

### Setup

```bash
# Clone the repository
git clone https://github.com/dhanush-shetty1/HookFlow.git
cd HookFlow

# Install root & client dependencies
npm install
npm install --prefix client

# Start development servers (Express server + Vite client)
npm run dev
```

The application will be accessible at:
- **Dashboard**: `http://localhost:3000`
- **Ingestion Server**: `http://localhost:4000`

## Configuration

Hookflow works out of the box with zero external configuration. Additional integrations can be enabled via environment variables:

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `PORT` | `number` | No | `4000` | Port for Express server and WebSocket listener. |
| `NODE_ENV` | `string` | No | `development` | Environment mode (`development` / `production`). |
| `MONGODB_URI` | `string` | No | *None* | Connection string for MongoDB Atlas. If omitted, Hookflow uses embedded storage (`.hookflow_data/store.json`). |
| `GEMINI_API_KEY` | `string` | No | *None* | API key for Gemini 2.5 Flash schema generation. If omitted, Hookflow uses its built-in offline AST parser. |

### Example `.env` File

```env
PORT=4000
NODE_ENV=development
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hookflow
# GEMINI_API_KEY=AIzaSy...
```

## Testing an Inbound Webhook

Trigger a test Stripe event using `curl`:

```bash
curl.exe -X POST http://localhost:4000/hook/ep_stripe_demo \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1700000000,v1=55dd8cc8b1a8c6663c9e246e58b88a4908f1045c1a36562f6eb7b02bef553c15" \
  -d "{\"id\":\"evt_test_123\",\"type\":\"payment_intent.succeeded\",\"amount\":4900}"
```

The event will immediately appear in your console at `http://localhost:3000/console`.

## Production Build & Deployment

### Local Production Build

```bash
# Build React client bundle
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
docker build -t hookflow .
docker run -d -p 4000:4000 --env-file .env hookflow
```

### Render Deployment

Deploy via `render.yaml`:
- **Build Command**: `npm install && npm run build --prefix client`
- **Start Command**: `npm start`

## License

MIT License © 2026 Hookflow
