import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { db, connectMongo } from './db.js';
import { verifyWebhookSignature } from './signatureVerifier.js';
import { forwardWebhook } from './forwarder.js';
import { synthesizeOfflineSchema, synthesizeWithGemini } from './aiSynthesizer.js';
import { MOCK_TEMPLATES, buildMockPayload } from './mockWebhooks.js';
import { WebhookEvent, ReplayRequest } from './types.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4000;

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*']
}));

// Capture raw body for signature verification & parsed body
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
  limit: '15mb'
}));

app.use(express.urlencoded({
  extended: true,
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
  limit: '15mb'
}));

app.use(express.text({
  type: '*/*',
  limit: '15mb'
}));

// Fallback error handler for JSON parser so malformed JSON is captured as raw body
app.use((err: any, req: any, _res: any, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    req.body = req.rawBody || '';
    return next();
  }
  next(err);
});

// WebSocket Connection Manager
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  
  // Send initial handshake
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: {
      connectedAt: Date.now(),
      endpointsCount: db.getEndpoints().length,
      mongoConnected: db.isMongoConnected()
    }
  }));

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch {
      // ignore
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err);
    clients.delete(ws);
  });
});

function broadcast(type: string, data: any) {
  const payload = JSON.stringify({ type, data, timestamp: Date.now() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// ----------------------------------------------------
// 🪝 WEBHOOK INGESTION ENGINE: /hook/:endpointId
// ----------------------------------------------------
async function handleWebhookIngest(req: any, res: express.Response) {
  const endpointId = req.params.endpointId;
  const endpoint = db.getEndpoint(endpointId);

  if (!endpoint) {
    return res.status(404).json({
      error: 'Endpoint Not Found',
      message: `No active HookFlow endpoint registered with ID: ${endpointId}`,
      help: 'Create an endpoint in HookFlow dashboard or check the URL.'
    });
  }

  // Extract raw body
  let rawBody = req.rawBody;
  if (typeof rawBody !== 'string') {
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (req.body && Object.keys(req.body).length > 0) {
      rawBody = JSON.stringify(req.body);
    } else {
      rawBody = '';
    }
  }

  // Verify Webhook Signature
  const signatureCheck = verifyWebhookSignature(
    req.headers,
    rawBody,
    endpoint.secret,
    endpoint.signatureProvider
  );

  const eventId = `evt_${Date.now()}_${uuidv4().slice(0, 8)}`;
  const sizeBytes = Buffer.byteLength(rawBody, 'utf8');

  // Build Webhook Event Object
  const webhookEvent: WebhookEvent = {
    id: eventId,
    endpointId: endpoint.id,
    method: req.method,
    path: req.originalUrl,
    headers: req.headers,
    query: req.query || {},
    rawBody,
    body: req.body,
    clientIp: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
    signatureStatus: signatureCheck.status,
    signatureDetails: signatureCheck.details,
    timestamp: Date.now(),
    sizeBytes,
    forwardStatus: endpoint.forwardEnabled && endpoint.forwardUrl ? 'pending' : 'disabled'
  };

  // Save event in DB
  db.saveEvent(webhookEvent);

  // Fast broadcast to all connected WebSocket clients (<15ms)
  broadcast('NEW_EVENT', webhookEvent);

  // Perform background auto-forward if enabled
  if (endpoint.forwardEnabled && endpoint.forwardUrl) {
    forwardWebhook(endpoint.forwardUrl, req.method, req.headers, req.body, rawBody)
      .then((forwardResp) => {
        webhookEvent.forwardStatus = forwardResp.statusCode >= 200 && forwardResp.statusCode < 400 ? 'success' : 'failed';
        webhookEvent.forwardResponse = forwardResp;
        db.updateEvent(webhookEvent.id, {
          forwardStatus: webhookEvent.forwardStatus,
          forwardResponse: forwardResp
        });
        broadcast('EVENT_FORWARDED', {
          eventId: webhookEvent.id,
          forwardStatus: webhookEvent.forwardStatus,
          forwardResponse: forwardResp
        });
      })
      .catch((err) => {
        webhookEvent.forwardStatus = 'failed';
        webhookEvent.forwardResponse = {
          statusCode: 0,
          statusText: 'Forward Error',
          timeMs: 0,
          headers: {},
          body: null,
          error: err.message
        };
        db.updateEvent(webhookEvent.id, {
          forwardStatus: 'failed',
          forwardResponse: webhookEvent.forwardResponse
        });
        broadcast('EVENT_FORWARDED', {
          eventId: webhookEvent.id,
          forwardStatus: 'failed',
          forwardResponse: webhookEvent.forwardResponse
        });
      });
  }

  // Immediate 200 OK response to external webhook sender
  return res.status(200).json({
    success: true,
    hookflowId: eventId,
    endpointId: endpoint.id,
    signatureStatus: signatureCheck.status,
    timestamp: webhookEvent.timestamp
  });
}

// Ingestion Routes (supports any method)
app.all('/hook/:endpointId', handleWebhookIngest);
app.all('/api/hook/:endpointId', handleWebhookIngest);

// ----------------------------------------------------
// 🚀 REST APIS FOR DEVELOPER DASHBOARD
// ----------------------------------------------------

// 1. Endpoints CRUD
app.get('/api/endpoints', (_req, res) => {
  res.json({ endpoints: db.getEndpoints() });
});

app.post('/api/endpoints', (req, res) => {
  const { name, description, secret, signatureProvider, forwardUrl, forwardEnabled, id } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Endpoint name is required' });
  }

  const endpoint = db.createEndpoint({
    id,
    name,
    description,
    secret,
    signatureProvider: signatureProvider || 'auto',
    forwardUrl,
    forwardEnabled: !!forwardEnabled
  });

  broadcast('ENDPOINT_CREATED', endpoint);
  res.status(201).json({ endpoint });
});

app.put('/api/endpoints/:id', (req, res) => {
  const updated = db.updateEndpoint(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  broadcast('ENDPOINT_UPDATED', updated);
  res.json({ endpoint: updated });
});

app.delete('/api/endpoints/:id', (req, res) => {
  const deleted = db.deleteEndpoint(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  broadcast('ENDPOINT_DELETED', { id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

// 2. Events Queries
app.get('/api/events', (req, res) => {
  const endpointId = req.query.endpointId as string;
  const limit = parseInt(req.query.limit as string) || 100;
  const events = db.getEvents(endpointId, limit);
  res.json({ events });
});

app.get('/api/events/:id', (req, res) => {
  const event = db.getEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json({ event });
});

app.delete('/api/events', (req, res) => {
  const endpointId = req.query.endpointId as string;
  const count = db.clearEvents(endpointId);
  broadcast('EVENTS_CLEARED', { endpointId });
  res.json({ success: true, deletedCount: count });
});

// 3. 1-Click Replay Engine
app.post('/api/replay', async (req, res) => {
  const { targetUrl, method, headers, body, eventId } = req.body as ReplayRequest;

  if (!targetUrl) {
    return res.status(400).json({ error: 'targetUrl is required' });
  }

  const result = await forwardWebhook(
    targetUrl,
    method || 'POST',
    headers || {},
    body
  );

  if (eventId) {
    db.updateEvent(eventId, {
      forwardResponse: result,
      forwardStatus: result.statusCode >= 200 && result.statusCode < 400 ? 'success' : 'failed'
    });
    broadcast('EVENT_REPLAYED', { eventId, result });
  }

  res.json({ result });
});

// 4. AI Schema Synthesizer (Gemini / Offline)
app.post('/api/synthesize', async (req, res) => {
  const { payload, apiKey, providerHint, useGemini } = req.body;

  if (payload === undefined) {
    return res.status(400).json({ error: 'Payload is required for synthesis' });
  }

  try {
    if (useGemini || apiKey || process.env.GEMINI_API_KEY) {
      const result = await synthesizeWithGemini(payload, apiKey, providerHint || 'Webhook');
      return res.json({ result });
    } else {
      const result = synthesizeOfflineSchema(payload, 'WebhookPayload', providerHint || 'Webhook');
      return res.json({ result });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Mock Webhook Trigger
app.get('/api/mock/templates', (_req, res) => {
  res.json({ templates: MOCK_TEMPLATES });
});

app.post('/api/mock/send', async (req, res) => {
  const { endpointId, templateId, customSecret } = req.body;
  const endpoint = db.getEndpoint(endpointId);

  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const mock = buildMockPayload(templateId, customSecret || endpoint.secret);

  // Directly process through ingestion pipeline
  const eventId = `evt_mock_${Date.now()}_${uuidv4().slice(0, 6)}`;
  const signatureCheck = verifyWebhookSignature(
    mock.headers,
    mock.rawBody,
    mock.effectiveSecret,
    endpoint.signatureProvider === 'auto' ? mock.template.provider : endpoint.signatureProvider
  );

  const webhookEvent: WebhookEvent = {
    id: eventId,
    endpointId: endpoint.id,
    method: mock.template.method,
    path: `/hook/${endpoint.id}`,
    headers: mock.headers,
    query: {},
    rawBody: mock.rawBody,
    body: mock.body,
    clientIp: '127.0.0.1 (Mock Generator)',
    signatureStatus: signatureCheck.status,
    signatureDetails: signatureCheck.details,
    timestamp: Date.now(),
    sizeBytes: Buffer.byteLength(mock.rawBody, 'utf8'),
    forwardStatus: endpoint.forwardEnabled && endpoint.forwardUrl ? 'pending' : 'disabled'
  };

  db.saveEvent(webhookEvent);
  broadcast('NEW_EVENT', webhookEvent);

  if (endpoint.forwardEnabled && endpoint.forwardUrl) {
    forwardWebhook(endpoint.forwardUrl, webhookEvent.method, webhookEvent.headers, webhookEvent.body, webhookEvent.rawBody)
      .then(forwardResp => {
        webhookEvent.forwardStatus = forwardResp.statusCode >= 200 && forwardResp.statusCode < 400 ? 'success' : 'failed';
        webhookEvent.forwardResponse = forwardResp;
        db.updateEvent(webhookEvent.id, {
          forwardStatus: webhookEvent.forwardStatus,
          forwardResponse: forwardResp
        });
        broadcast('EVENT_FORWARDED', {
          eventId: webhookEvent.id,
          forwardStatus: webhookEvent.forwardStatus,
          forwardResponse: forwardResp
        });
      });
  }

  res.json({ success: true, event: webhookEvent });
});

// 6. Server Health & Stats
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
    connectedClients: clients.size,
    mongoConnected: db.isMongoConnected(),
    endpointsCount: db.getEndpoints().length,
    eventsCount: db.getEvents().length
  });
});

// 7. Serve Static Client in Production if built
const clientDist = path.resolve(process.cwd(), 'client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/hook')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// Start Server
async function startServer() {
  await connectMongo();
  server.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🪝 HookFlow Server Running on http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Event Bus ready on ws://localhost:${PORT}`);
    console.log(`📥 Dynamic Ingestion URLs: http://localhost:${PORT}/hook/:endpointId`);
    console.log(`💻 Web Dashboard: http://localhost:${PORT}`);
    console.log(`=================================================\n`);
  });
}

startServer();
