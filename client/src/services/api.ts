import {
  Endpoint,
  WebhookEvent,
  SchemaSynthesisResult,
  MockWebhookTemplate,
  ForwardResponse,
  User,
  AuthResponse
} from '../types';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const isDev = window.location.hostname === 'localhost' && window.location.port === '3000';
    return isDev ? 'http://localhost:4000/api' : `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
};

const API_BASE = getApiBase();

function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hookflow_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const api = {
  // ── AUTHENTICATION ─────────────────────────────────────────────────────────
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('hookflow_token');
  },

  setToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('hookflow_token', token);
    } else {
      localStorage.removeItem('hookflow_token');
    }
  },

  async register(params: { email: string; password: string; name: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async login(params: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders()
      });
      if (!res.ok) {
        this.setToken(null);
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  logout() {
    this.setToken(null);
  },

  // ── ENDPOINTS (DUAL-PLANE SCOPED) ──────────────────────────────────────────
  async getEndpoints(plane?: 'sandbox' | 'private' | 'all'): Promise<Endpoint[]> {
    const query = plane ? `?plane=${plane}` : '';
    const res = await fetch(`${API_BASE}/endpoints${query}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data.endpoints || [];
  },

  async createEndpoint(payload: Partial<Endpoint>): Promise<Endpoint> {
    const res = await fetch(`${API_BASE}/endpoints`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Failed to create endpoint');
    return data.endpoint;
  },

  async updateEndpoint(id: string, payload: Partial<Endpoint>): Promise<Endpoint> {
    const res = await fetch(`${API_BASE}/endpoints/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Failed to update endpoint');
    return data.endpoint;
  },

  async deleteEndpoint(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/endpoints/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete endpoint');
    return data.success;
  },

  // ── EVENTS (DUAL-PLANE SCOPED) ─────────────────────────────────────────────
  async getEvents(endpointId?: string, plane?: 'sandbox' | 'private' | 'all'): Promise<WebhookEvent[]> {
    const params = new URLSearchParams();
    if (endpointId) params.append('endpointId', endpointId);
    if (plane) params.append('plane', plane);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/events${query}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    return data.events || [];
  },

  async getEvent(id: string): Promise<WebhookEvent> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch event');
    return data.event;
  },

  async clearEvents(endpointId?: string): Promise<boolean> {
    const query = endpointId ? `?endpointId=${endpointId}` : '';
    const res = await fetch(`${API_BASE}/events${query}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    return data.success;
  },

  // ── REPLAY ENGINE ──────────────────────────────────────────────────────────
  async replayWebhook(params: {
    targetUrl: string;
    method: string;
    headers: Record<string, string>;
    body: any;
    eventId?: string;
  }): Promise<ForwardResponse> {
    const isLocal = params.targetUrl.includes('localhost') || params.targetUrl.includes('127.0.0.1');

    // HookFlow LocalBridge™ Browser-Direct Relay
    if (isLocal && typeof window !== 'undefined') {
      const start = performance.now();
      try {
        const bodyContent = typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
        const headersToSend: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-forwarded-by': 'HookFlow-LocalBridge/1.0',
          ...(params.headers || {})
        };

        const res = await fetch(params.targetUrl, {
          method: params.method || 'POST',
          headers: headersToSend,
          body: bodyContent
        });

        const timeMs = Math.round(performance.now() - start);
        let respData: any = '';
        try {
          respData = await res.json();
        } catch {
          respData = await res.text();
        }

        return {
          statusCode: res.status,
          statusText: res.statusText || (res.status >= 200 && res.status < 300 ? 'OK' : 'Response Error'),
          headers: Object.fromEntries(res.headers.entries()),
          body: respData,
          timeMs
        };
      } catch (err: any) {
        const timeMs = Math.round(performance.now() - start);
        return {
          statusCode: 0,
          statusText: 'LocalBridge Connection Refused',
          headers: {},
          body: {
            error: `Could not connect to ${params.targetUrl}. Is your local application running?`,
            details: err.message,
            tip: 'HookFlow LocalBridge™ attempted browser-direct delivery to localhost without ngrok or third-party tunnels.'
          },
          timeMs,
          error: err.message
        };
      }
    }

    // Standard remote server relay via backend
    const res = await fetch(`${API_BASE}/replay`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Replay failed');
    return data.result;
  },

  async synthesizeSchema(params: {
    payload: any;
    apiKey?: string;
    providerHint?: string;
    useGemini?: boolean;
  }): Promise<SchemaSynthesisResult> {
    const res = await fetch(`${API_BASE}/synthesize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Synthesis failed');
    return data.result;
  },

  async getMockTemplates(): Promise<MockWebhookTemplate[]> {
    const res = await fetch(`${API_BASE}/mock/templates`);
    const data = await res.json();
    return data.templates || [];
  },

  async sendMockWebhook(endpointId: string, templateId: string, customSecret?: string): Promise<WebhookEvent> {
    const res = await fetch(`${API_BASE}/mock/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ endpointId, templateId, customSecret })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Mock send failed');
    return data.event;
  },

  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  }
};
