import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Endpoint, WebhookEvent } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), '.hookflow_data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Memory store
interface DBStructure {
  endpoints: Endpoint[];
  events: WebhookEvent[];
}

let dbCache: DBStructure = {
  endpoints: [],
  events: []
};

let mongoConnected = false;

// Initialize file database
function initLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      dbCache = JSON.parse(content);
    } else {
      // Seed initial endpoints
      dbCache = {
        endpoints: [
          {
            id: 'ep_stripe_demo',
            name: 'Stripe Payments Hook',
            description: 'Capture Stripe charge, checkout and payment_intent events',
            signatureProvider: 'stripe',
            secret: 'whsec_test_secret_1234567890abcdef',
            forwardUrl: 'http://localhost:3000/api/webhooks/stripe',
            forwardEnabled: false,
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now() - 3600000,
            totalEventsCount: 0
          },
          {
            id: 'ep_github_demo',
            name: 'GitHub Repository Events',
            description: 'Ingest GitHub push, PR and issue webhook notifications',
            signatureProvider: 'github',
            secret: 'gh_webhook_secret_998877',
            forwardUrl: 'http://localhost:3000/api/webhooks/github',
            forwardEnabled: false,
            createdAt: Date.now() - 7200000,
            updatedAt: Date.now() - 7200000,
            totalEventsCount: 0
          },
          {
            id: 'ep_default',
            name: 'General Sandbox Inbox',
            description: 'Catch-all inbox for any custom HTTP webhook payload',
            signatureProvider: 'auto',
            forwardUrl: 'http://localhost:3000/api/webhook',
            forwardEnabled: false,
            createdAt: Date.now() - 10800000,
            updatedAt: Date.now() - 10800000,
            totalEventsCount: 0
          }
        ],
        events: []
      };
      saveLocalStore();
    }
  } catch (err) {
    console.error('[DB] Failed to load local database:', err);
  }
}

function saveLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Failed to save local database:', err);
  }
}

// Optional MongoDB initialization
export async function connectMongo(uri?: string) {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[DB] Running with high-performance embedded JSON database (.hookflow_data/db.json).');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    mongoConnected = true;
    console.log('[DB] Successfully connected to MongoDB:', mongoUri);
    return true;
  } catch (err: any) {
    console.warn(`[DB] MongoDB connection failed (${err.message}). Using local embedded storage.`);
    mongoConnected = false;
    return false;
  }
}

// Initialize on module load
initLocalStore();

export const db = {
  isMongoConnected() {
    return mongoConnected;
  },

  getEndpoints(): Endpoint[] {
    return [...dbCache.endpoints].sort((a, b) => b.createdAt - a.createdAt);
  },

  getEndpoint(id: string): Endpoint | undefined {
    return dbCache.endpoints.find(e => e.id === id);
  },

  createEndpoint(data: Partial<Endpoint> & { name: string }): Endpoint {
    const id = data.id || `ep_${Math.random().toString(36).substring(2, 10)}`;
    const newEndpoint: Endpoint = {
      id,
      name: data.name,
      description: data.description || '',
      secret: data.secret || '',
      signatureProvider: data.signatureProvider || 'auto',
      forwardUrl: data.forwardUrl || '',
      forwardEnabled: !!data.forwardEnabled,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalEventsCount: 0
    };

    dbCache.endpoints.unshift(newEndpoint);
    saveLocalStore();
    return newEndpoint;
  },

  updateEndpoint(id: string, data: Partial<Endpoint>): Endpoint | undefined {
    const index = dbCache.endpoints.findIndex(e => e.id === id);
    if (index === -1) return undefined;

    dbCache.endpoints[index] = {
      ...dbCache.endpoints[index],
      ...data,
      id, // protect id
      updatedAt: Date.now()
    };

    saveLocalStore();
    return dbCache.endpoints[index];
  },

  deleteEndpoint(id: string): boolean {
    const initialLength = dbCache.endpoints.length;
    dbCache.endpoints = dbCache.endpoints.filter(e => e.id !== id);
    dbCache.events = dbCache.events.filter(ev => ev.endpointId !== id);
    saveLocalStore();
    return dbCache.endpoints.length < initialLength;
  },

  getEvents(endpointId?: string, limit = 100): WebhookEvent[] {
    let list = dbCache.events;
    if (endpointId) {
      list = list.filter(e => e.endpointId === endpointId);
    }
    return list.slice(0, limit);
  },

  getEvent(id: string): WebhookEvent | undefined {
    return dbCache.events.find(e => e.id === id);
  },

  saveEvent(event: WebhookEvent): WebhookEvent {
    // Keep max 500 events in memory/disk
    dbCache.events.unshift(event);
    if (dbCache.events.length > 500) {
      dbCache.events = dbCache.events.slice(0, 500);
    }

    // Increment count on endpoint
    const endpoint = dbCache.endpoints.find(e => e.id === event.endpointId);
    if (endpoint) {
      endpoint.totalEventsCount = (endpoint.totalEventsCount || 0) + 1;
      endpoint.updatedAt = Date.now();
    }

    saveLocalStore();
    return event;
  },

  updateEvent(id: string, updates: Partial<WebhookEvent>): WebhookEvent | undefined {
    const event = dbCache.events.find(e => e.id === id);
    if (!event) return undefined;

    Object.assign(event, updates);
    saveLocalStore();
    return event;
  },

  clearEvents(endpointId?: string): number {
    const prevCount = dbCache.events.length;
    if (endpointId) {
      dbCache.events = dbCache.events.filter(e => e.endpointId !== endpointId);
      const ep = dbCache.endpoints.find(e => e.id === endpointId);
      if (ep) ep.totalEventsCount = 0;
    } else {
      dbCache.events = [];
      dbCache.endpoints.forEach(e => e.totalEventsCount = 0);
    }
    saveLocalStore();
    return prevCount - dbCache.events.length;
  }
};
