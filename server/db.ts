import fs from 'fs';
import path from 'path';
import mongoose, { Schema, Document } from 'mongoose';
import { Endpoint, WebhookEvent, User } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), '.hookflow_data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Mongoose Models
interface UserDoc extends Document, Omit<User, 'id'> {
  userId: string;
}

const UserSchema = new Schema<UserDoc>({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Number, default: () => Date.now() }
});

const EndpointSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true, default: null },
  isPublic: { type: Boolean, default: false, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  secret: { type: String, default: '' },
  signatureProvider: { type: String, default: 'auto' },
  forwardUrl: { type: String, default: '' },
  forwardEnabled: { type: Boolean, default: false },
  createdAt: { type: Number, default: () => Date.now() },
  updatedAt: { type: Number, default: () => Date.now() },
  totalEventsCount: { type: Number, default: 0 }
});

const WebhookEventSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  endpointId: { type: String, required: true, index: true },
  userId: { type: String, index: true, default: null },
  isPublic: { type: Boolean, default: false, index: true },
  method: { type: String, default: 'POST' },
  path: { type: String, default: '' },
  headers: { type: Schema.Types.Mixed, default: {} },
  query: { type: Schema.Types.Mixed, default: {} },
  rawBody: { type: String, default: '' },
  body: { type: Schema.Types.Mixed, default: {} },
  clientIp: { type: String, default: '127.0.0.1' },
  signatureStatus: { type: String, default: 'unsigned' },
  signatureDetails: { type: Schema.Types.Mixed, default: null },
  timestamp: { type: Number, default: () => Date.now(), index: true },
  sizeBytes: { type: Number, default: 0 },
  forwardStatus: { type: String, default: 'disabled' },
  forwardResponse: { type: Schema.Types.Mixed, default: null }
});

let UserModel: mongoose.Model<any>;
let EndpointModel: mongoose.Model<any>;
let WebhookEventModel: mongoose.Model<any>;

// In-Memory Fallback Cache
interface DBStructure {
  users: User[];
  endpoints: Endpoint[];
  events: WebhookEvent[];
}

let dbCache: DBStructure = {
  users: [],
  endpoints: [],
  events: []
};

let mongoConnected = false;

// Default pre-seeded public sandbox endpoints
const PUBLIC_DEMO_ENDPOINTS: Endpoint[] = [
  {
    id: 'ep_stripe_demo',
    isPublic: true,
    name: 'Stripe Payments Hook',
    description: 'Capture Stripe charge, checkout and payment_intent events',
    signatureProvider: 'stripe',
    secret: 'whsec_test_secret_1234567890abcdef',
    forwardUrl: 'http://localhost:5001/api/webhook',
    forwardEnabled: false,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    totalEventsCount: 0
  },
  {
    id: 'ep_github_demo',
    isPublic: true,
    name: 'GitHub Repository Events',
    description: 'Ingest GitHub push, PR and issue webhook notifications',
    signatureProvider: 'github',
    secret: 'gh_webhook_secret_998877',
    forwardUrl: 'http://localhost:5001/api/webhook',
    forwardEnabled: false,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
    totalEventsCount: 0
  },
  {
    id: 'ep_default',
    isPublic: true,
    name: 'General Sandbox Inbox',
    description: 'Catch-all inbox for any custom HTTP webhook payload',
    signatureProvider: 'auto',
    forwardUrl: 'http://localhost:5001/api/webhook',
    forwardEnabled: false,
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 10800000,
    totalEventsCount: 0
  }
];

function initLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      dbCache = JSON.parse(content);
      if (!dbCache.users) dbCache.users = [];
      if (!dbCache.endpoints) dbCache.endpoints = [];
      if (!dbCache.events) dbCache.events = [];
    } else {
      dbCache = {
        users: [],
        endpoints: [...PUBLIC_DEMO_ENDPOINTS],
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

// Initialize Mongoose & sync with MongoDB
export async function connectMongo(uri?: string) {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[DB] Running with high-performance embedded JSON database (.hookflow_data/db.json).');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
    mongoConnected = true;

    // Define models
    UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
    EndpointModel = mongoose.models.Endpoint || mongoose.model('Endpoint', EndpointSchema);
    WebhookEventModel = mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', WebhookEventSchema);

    // Seed public endpoints in MongoDB if not already present
    for (const demoEp of PUBLIC_DEMO_ENDPOINTS) {
      await EndpointModel.updateOne(
        { id: demoEp.id },
        { $setOnInsert: demoEp },
        { upsert: true }
      );
    }

    console.log('[DB] ✅ Successfully connected to MongoDB Atlas! Cloud persistence active.');
    return true;
  } catch (err: any) {
    console.warn(`[DB] ⚠️ MongoDB connection failed (${err.message}). Using local embedded storage.`);
    mongoConnected = false;
    return false;
  }
}

initLocalStore();

export const db = {
  isMongoConnected() {
    return mongoConnected;
  },

  // ── USER MANAGEMENT ────────────────────────────────────────────────────────
  async createUser(data: { email: string; passwordHash: string; name: string }): Promise<User> {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const user: User = {
      id,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      passwordHash: data.passwordHash,
      createdAt: Date.now()
    };

    if (mongoConnected && UserModel) {
      await UserModel.create({
        userId: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt
      });
    }

    dbCache.users.push(user);
    saveLocalStore();
    return user;
  },

  async findUserByEmail(email: string): Promise<User | undefined> {
    const cleanEmail = email.toLowerCase().trim();
    if (mongoConnected && UserModel) {
      const doc: any = await UserModel.findOne({ email: cleanEmail }).lean();
      if (doc) {
        return {
          id: doc.userId,
          email: doc.email,
          name: doc.name,
          passwordHash: doc.passwordHash,
          createdAt: doc.createdAt
        };
      }
    }
    return dbCache.users.find(u => u.email === cleanEmail);
  },

  async findUserById(id: string): Promise<User | undefined> {
    if (mongoConnected && UserModel) {
      const doc: any = await UserModel.findOne({ userId: id }).lean();
      if (doc) {
        return {
          id: doc.userId,
          email: doc.email,
          name: doc.name,
          passwordHash: doc.passwordHash,
          createdAt: doc.createdAt
        };
      }
    }
    return dbCache.users.find(u => u.id === id);
  },

  // ── ENDPOINTS (DUAL-PLANE SCOPED) ──────────────────────────────────────────
  async getEndpoints(userId?: string, plane: 'sandbox' | 'private' | 'all' = 'all'): Promise<Endpoint[]> {
    if (mongoConnected && EndpointModel) {
      let query: any = {};
      if (plane === 'sandbox') {
        query = { isPublic: true };
      } else if (plane === 'private') {
        if (!userId) return [];
        query = { userId, isPublic: false };
      } else {
        // 'all'
        if (userId) {
          query = { $or: [{ isPublic: true }, { userId }] };
        } else {
          query = { isPublic: true };
        }
      }
      const docs = await EndpointModel.find(query).sort({ createdAt: -1 }).lean();
      return docs.map((d: any) => ({
        id: d.id,
        userId: d.userId,
        isPublic: !!d.isPublic,
        name: d.name,
        description: d.description,
        secret: d.secret,
        signatureProvider: d.signatureProvider,
        forwardUrl: d.forwardUrl,
        forwardEnabled: d.forwardEnabled,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        totalEventsCount: d.totalEventsCount || 0
      }));
    }

    // Local in-memory filter
    return dbCache.endpoints
      .filter(e => {
        if (plane === 'sandbox') return e.isPublic;
        if (plane === 'private') return !e.isPublic && e.userId === userId;
        if (userId) return e.isPublic || e.userId === userId;
        return e.isPublic;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getEndpoint(id: string): Promise<Endpoint | undefined> {
    if (mongoConnected && EndpointModel) {
      const doc = await EndpointModel.findOne({ id }).lean();
      if (doc) {
        const d: any = doc;
        return {
          id: d.id,
          userId: d.userId,
          isPublic: !!d.isPublic,
          name: d.name,
          description: d.description,
          secret: d.secret,
          signatureProvider: d.signatureProvider,
          forwardUrl: d.forwardUrl,
          forwardEnabled: d.forwardEnabled,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          totalEventsCount: d.totalEventsCount || 0
        };
      }
    }
    return dbCache.endpoints.find(e => e.id === id);
  },

  async createEndpoint(data: Partial<Endpoint> & { name: string }, userId?: string): Promise<Endpoint> {
    const id = data.id || `ep_${Math.random().toString(36).substring(2, 10)}`;
    const isPublic = Boolean(data.isPublic && !userId);
    const newEndpoint: Endpoint = {
      id,
      userId: userId || undefined,
      isPublic,
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

    if (mongoConnected && EndpointModel) {
      await EndpointModel.create(newEndpoint);
    }

    dbCache.endpoints.unshift(newEndpoint);
    saveLocalStore();
    return newEndpoint;
  },

  async updateEndpoint(id: string, data: Partial<Endpoint>, userId?: string): Promise<Endpoint | undefined> {
    const ep = await this.getEndpoint(id);
    if (!ep) return undefined;

    // Check ownership for private endpoints
    if (!ep.isPublic && ep.userId && ep.userId !== userId) {
      return undefined;
    }

    const updates = {
      ...data,
      id, // protect ID
      updatedAt: Date.now()
    };

    if (mongoConnected && EndpointModel) {
      await EndpointModel.updateOne({ id }, { $set: updates });
    }

    const index = dbCache.endpoints.findIndex(e => e.id === id);
    if (index !== -1) {
      dbCache.endpoints[index] = { ...dbCache.endpoints[index], ...updates };
      saveLocalStore();
    }

    return { ...ep, ...updates };
  },

  async deleteEndpoint(id: string, userId?: string): Promise<boolean> {
    const ep = await this.getEndpoint(id);
    if (!ep) return false;

    // Check ownership for private endpoints
    if (!ep.isPublic && ep.userId && ep.userId !== userId) {
      return false;
    }

    if (mongoConnected && EndpointModel) {
      await EndpointModel.deleteOne({ id });
      if (WebhookEventModel) {
        await WebhookEventModel.deleteMany({ endpointId: id });
      }
    }

    dbCache.endpoints = dbCache.endpoints.filter(e => e.id !== id);
    dbCache.events = dbCache.events.filter(ev => ev.endpointId !== id);
    saveLocalStore();
    return true;
  },

  // ── EVENTS (DUAL-PLANE SCOPED) ─────────────────────────────────────────────
  async getEvents(
    endpointId?: string,
    userId?: string,
    plane: 'sandbox' | 'private' | 'all' = 'all',
    limit = 100
  ): Promise<WebhookEvent[]> {
    if (mongoConnected && WebhookEventModel) {
      const query: any = {};
      if (endpointId) query.endpointId = endpointId;
      
      if (plane === 'sandbox') {
        query.isPublic = true;
      } else if (plane === 'private') {
        if (!userId) return [];
        query.userId = userId;
        query.isPublic = false;
      } else {
        if (userId) {
          query.$or = [{ isPublic: true }, { userId }];
        } else {
          query.isPublic = true;
        }
      }

      const docs = await WebhookEventModel.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return docs as any[];
    }

    let list = dbCache.events;
    if (endpointId) {
      list = list.filter(e => e.endpointId === endpointId);
    }

    if (plane === 'sandbox') {
      list = list.filter(e => e.isPublic);
    } else if (plane === 'private') {
      if (!userId) return [];
      list = list.filter(e => !e.isPublic && e.userId === userId);
    } else {
      if (userId) {
        list = list.filter(e => e.isPublic || e.userId === userId);
      } else {
        list = list.filter(e => e.isPublic);
      }
    }

    return list.slice(0, limit);
  },

  async getEvent(id: string, userId?: string): Promise<WebhookEvent | undefined> {
    if (mongoConnected && WebhookEventModel) {
      const doc = await WebhookEventModel.findOne({ id }).lean();
      if (doc) {
        const ev = doc as any;
        if (ev.isPublic || ev.userId === userId) {
          return ev;
        }
      }
      return undefined;
    }

    const event = dbCache.events.find(e => e.id === id);
    if (event && (event.isPublic || event.userId === userId)) {
      return event;
    }
    return undefined;
  },

  async saveEvent(event: WebhookEvent): Promise<WebhookEvent> {
    if (mongoConnected && WebhookEventModel) {
      await WebhookEventModel.create(event);
      if (EndpointModel) {
        await EndpointModel.updateOne(
          { id: event.endpointId },
          { $inc: { totalEventsCount: 1 }, $set: { updatedAt: Date.now() } }
        );
      }
    }

    dbCache.events.unshift(event);
    if (dbCache.events.length > 500) {
      dbCache.events = dbCache.events.slice(0, 500);
    }

    const ep = dbCache.endpoints.find(e => e.id === event.endpointId);
    if (ep) {
      ep.totalEventsCount = (ep.totalEventsCount || 0) + 1;
      ep.updatedAt = Date.now();
    }

    saveLocalStore();
    return event;
  },

  async updateEvent(id: string, updates: Partial<WebhookEvent>): Promise<WebhookEvent | undefined> {
    if (mongoConnected && WebhookEventModel) {
      await WebhookEventModel.updateOne({ id }, { $set: updates });
    }

    const event = dbCache.events.find(e => e.id === id);
    if (event) {
      Object.assign(event, updates);
      saveLocalStore();
    }
    return event;
  },

  async clearEvents(endpointId?: string, userId?: string): Promise<number> {
    if (mongoConnected && WebhookEventModel) {
      const query: any = {};
      if (endpointId) query.endpointId = endpointId;
      if (userId) query.userId = userId;
      else query.isPublic = true;

      const res = await WebhookEventModel.deleteMany(query);
      return res.deletedCount || 0;
    }

    const prevCount = dbCache.events.length;
    if (endpointId) {
      dbCache.events = dbCache.events.filter(e => {
        if (e.endpointId !== endpointId) return true;
        if (userId && e.userId !== userId) return true;
        if (!userId && !e.isPublic) return true;
        return false;
      });
      const ep = dbCache.endpoints.find(e => e.id === endpointId);
      if (ep && (ep.isPublic || ep.userId === userId)) ep.totalEventsCount = 0;
    } else {
      dbCache.events = dbCache.events.filter(e => {
        if (userId && e.userId !== userId) return true;
        if (!userId && !e.isPublic) return true;
        return false;
      });
    }

    saveLocalStore();
    return prevCount - dbCache.events.length;
  }
};
