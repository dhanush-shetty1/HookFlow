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
import {
  requireAuth,
  optionalAuth,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  AuthenticatedRequest
} from './auth.js';

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

// ----------------------------------------------------
// ⚡ WEBSOCKET CONNECTION & DUAL-PLANE ROUTING
// ----------------------------------------------------
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

const clients = new Set<AuthenticatedWebSocket>();

wss.on('connection', (ws: AuthenticatedWebSocket) => {
  clients.add(ws);
  ws.isAlive = true;

  // Send initial handshake
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: {
      connectedAt: Date.now(),
      mongoConnected: db.isMongoConnected()
    }
  }));

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      } else if (parsed.type === 'AUTH') {
        if (parsed.token) {
          const user = verifyToken(parsed.token);
          if (user) {
            ws.userId = user.id;
            ws.send(JSON.stringify({
              type: 'AUTH_SUCCESS',
              user: { id: user.id, email: user.email, name: user.name }
            }));
          } else {
            ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid or expired token' }));
          }
        }
      } else if (parsed.type === 'LOGOUT') {
        ws.userId = undefined;
        ws.send(JSON.stringify({ type: 'LOGOUT_SUCCESS' }));
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

// Dual-Plane Broadcasting functions
function broadcastToPublic(type: string, data: any) {
  const payload = JSON.stringify({ type, data, timestamp: Date.now() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function broadcastToUser(userId: string | undefined, type: string, data: any) {
  if (!userId) return;
  const payload = JSON.stringify({ type, data, timestamp: Date.now() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(payload);
    }
  }
}

// ----------------------------------------------------
// 🪝 WEBHOOK INGESTION ENGINE: /hook/:endpointId
// ----------------------------------------------------
async function handleWebhookIngest(req: any, res: express.Response) {
  const endpointId = req.params.endpointId;
  const endpoint = await db.getEndpoint(endpointId);

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

  // Build Webhook Event Object with dual-plane tagging
  const webhookEvent: WebhookEvent = {
    id: eventId,
    endpointId: endpoint.id,
    userId: endpoint.userId,
    isPublic: !!endpoint.isPublic,
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
  await db.saveEvent(webhookEvent);

  // Strict room-filtered broadcast (<15ms)
  if (endpoint.isPublic) {
    broadcastToPublic('NEW_EVENT', webhookEvent);
  } else if (endpoint.userId) {
    broadcastToUser(endpoint.userId, 'NEW_EVENT', webhookEvent);
  }

  // Perform background auto-forward if enabled
  if (endpoint.forwardEnabled && endpoint.forwardUrl) {
    forwardWebhook(endpoint.forwardUrl, req.method, req.headers, req.body, rawBody)
      .then(async (forwardResp) => {
        webhookEvent.forwardStatus = forwardResp.statusCode >= 200 && forwardResp.statusCode < 400 ? 'success' : 'failed';
        webhookEvent.forwardResponse = forwardResp;
        await db.updateEvent(webhookEvent.id, {
          forwardStatus: webhookEvent.forwardStatus,
          forwardResponse: forwardResp
        });
        const forwardUpdate = {
          eventId: webhookEvent.id,
          forwardStatus: webhookEvent.forwardStatus,
          forwardResponse: forwardResp
        };
        if (endpoint.isPublic) {
          broadcastToPublic('EVENT_FORWARDED', forwardUpdate);
        } else if (endpoint.userId) {
          broadcastToUser(endpoint.userId, 'EVENT_FORWARDED', forwardUpdate);
        }
      })
      .catch(async (err) => {
        webhookEvent.forwardStatus = 'failed';
        webhookEvent.forwardResponse = {
          statusCode: 0,
          statusText: 'Forward Error',
          timeMs: 0,
          headers: {},
          body: null,
          error: err.message
        };
        await db.updateEvent(webhookEvent.id, {
          forwardStatus: 'failed',
          forwardResponse: webhookEvent.forwardResponse
        });
        const forwardUpdate = {
          eventId: webhookEvent.id,
          forwardStatus: 'failed',
          forwardResponse: webhookEvent.forwardResponse
        };
        if (endpoint.isPublic) {
          broadcastToPublic('EVENT_FORWARDED', forwardUpdate);
        } else if (endpoint.userId) {
          broadcastToUser(endpoint.userId, 'EVENT_FORWARDED', forwardUpdate);
        }
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
// 🔐 AUTHENTICATION ENDPOINTS (JWT + BCRYPT)
// ----------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = hashPassword(password);
    const user = await db.createUser({ email, passwordHash, name });
    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.findUserByEmail(email);
    if (!user || !comparePassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------
// 🚀 REST APIS FOR DEVELOPER DASHBOARD
// ----------------------------------------------------

// 1. Endpoints CRUD (Dual-Plane Scoped)
app.get('/api/endpoints', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const plane = (req.query.plane as any) || (req.user ? 'all' : 'sandbox');
  const endpoints = await db.getEndpoints(req.user?.id, plane);
  res.json({ endpoints });
});

app.post('/api/endpoints', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const { name, description, secret, signatureProvider, forwardUrl, forwardEnabled, id } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Endpoint name is required' });
  }

  // If user is not authenticated, require login for custom endpoints
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Please sign in to create secure private webhook endpoints in your personal vault.'
    });
  }

  const endpoint = await db.createEndpoint({
    id,
    name,
    description,
    secret,
    signatureProvider: signatureProvider || 'auto',
    forwardUrl,
    forwardEnabled: !!forwardEnabled,
    isPublic: false
  }, req.user.id);

  broadcastToUser(req.user.id, 'ENDPOINT_CREATED', endpoint);
  res.status(201).json({ endpoint });
});

app.put('/api/endpoints/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const updated = await db.updateEndpoint(req.params.id, req.body, req.user?.id);
  if (!updated) {
    return res.status(404).json({ error: 'Endpoint not found or permission denied' });
  }

  if (updated.isPublic) {
    broadcastToPublic('ENDPOINT_UPDATED', updated);
  } else if (updated.userId) {
    broadcastToUser(updated.userId, 'ENDPOINT_UPDATED', updated);
  }

  res.json({ endpoint: updated });
});

app.delete('/api/endpoints/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const existing = await db.getEndpoint(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  if (existing.isPublic) {
    return res.status(403).json({ error: 'Default public sandbox endpoints cannot be deleted' });
  }

  const deleted = await db.deleteEndpoint(req.params.id, req.user?.id);
  if (!deleted) {
    return res.status(403).json({ error: 'Permission denied to delete endpoint' });
  }

  if (existing.userId) {
    broadcastToUser(existing.userId, 'ENDPOINT_DELETED', { id: req.params.id });
  }

  res.json({ success: true, id: req.params.id });
});

// 2. Events Queries (Dual-Plane Scoped)
app.get('/api/events', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const endpointId = req.query.endpointId as string;
  const plane = (req.query.plane as any) || (req.user ? 'all' : 'sandbox');
  const limit = parseInt(req.query.limit as string) || 100;
  const events = await db.getEvents(endpointId, req.user?.id, plane, limit);
  res.json({ events });
});

app.get('/api/events/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const event = await db.getEvent(req.params.id, req.user?.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found or unauthorized' });
  }
  res.json({ event });
});

app.delete('/api/events', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const endpointId = req.query.endpointId as string;
  const count = await db.clearEvents(endpointId, req.user?.id);
  
  if (req.user?.id) {
    broadcastToUser(req.user.id, 'EVENTS_CLEARED', { endpointId });
  } else {
    broadcastToPublic('EVENTS_CLEARED', { endpointId });
  }

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
    const updated = await db.updateEvent(eventId, {
      forwardResponse: result,
      forwardStatus: result.statusCode >= 200 && result.statusCode < 400 ? 'success' : 'failed'
    });
    if (updated) {
      if (updated.isPublic) {
        broadcastToPublic('EVENT_REPLAYED', { eventId, result });
      } else if (updated.userId) {
        broadcastToUser(updated.userId, 'EVENT_REPLAYED', { eventId, result });
      }
    }
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

app.post('/api/mock/send', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const { endpointId, templateId, customSecret } = req.body;
  const endpoint = await db.getEndpoint(endpointId);

  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  // If private endpoint, ensure caller is owner
  if (!endpoint.isPublic && endpoint.userId && endpoint.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Permission denied to send mock to private endpoint' });
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
    userId: endpoint.userId,
    isPublic: !!endpoint.isPublic,
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

  await db.saveEvent(webhookEvent);

  if (endpoint.isPublic) {
    broadcastToPublic('NEW_EVENT', webhookEvent);
  } else if (endpoint.userId) {
    broadcastToUser(endpoint.userId, 'NEW_EVENT', webhookEvent);
  }

  if (endpoint.forwardEnabled && endpoint.forwardUrl) {
    forwardWebhook(endpoint.forwardUrl, webhookEvent.method, webhookEvent.headers, webhookEvent.body, webhookEvent.rawBody)
      .then(async (forwardResp) => {
        webhookEvent.forwardStatus = forwardResp.statusCode >= 200 && forwardResp.statusCode < 400 ? 'success' : 'failed';
        webhookEvent.forwardResponse = forwardResp;
        await db.updateEvent(webhookEvent.id, {
          forwardStatus: webhookEvent.forwardStatus,
          forwardResponse: forwardResp
        });
        const forwardUpdate = {
          eventId: webhookEvent.id,
          forwardStatus: webhookEvent.forwardStatus,
          forwardResponse: forwardResp
        };
        if (endpoint.isPublic) {
          broadcastToPublic('EVENT_FORWARDED', forwardUpdate);
        } else if (endpoint.userId) {
          broadcastToUser(endpoint.userId, 'EVENT_FORWARDED', forwardUpdate);
        }
      });
  }

  res.json({ success: true, event: webhookEvent });
});

// 6. Server Health & Stats
app.get('/api/health', async (_req, res) => {
  const eps = await db.getEndpoints();
  const evts = await db.getEvents();
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
    connectedClients: clients.size,
    mongoConnected: db.isMongoConnected(),
    endpointsCount: eps.length,
    eventsCount: evts.length
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
