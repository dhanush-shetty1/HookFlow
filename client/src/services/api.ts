import { Endpoint, WebhookEvent, SchemaSynthesisResult, MockWebhookTemplate, ForwardResponse } from '../types';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const isDev = window.location.hostname === 'localhost' && window.location.port === '3000';
    return isDev ? 'http://localhost:4000/api' : `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
};

const API_BASE = getApiBase();

export const api = {
  async getEndpoints(): Promise<Endpoint[]> {
    const res = await fetch(`${API_BASE}/endpoints`);
    const data = await res.json();
    return data.endpoints || [];
  },

  async createEndpoint(payload: Partial<Endpoint>): Promise<Endpoint> {
    const res = await fetch(`${API_BASE}/endpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create endpoint');
    return data.endpoint;
  },

  async updateEndpoint(id: string, payload: Partial<Endpoint>): Promise<Endpoint> {
    const res = await fetch(`${API_BASE}/endpoints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update endpoint');
    return data.endpoint;
  },

  async deleteEndpoint(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/endpoints/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return data.success;
  },

  async getEvents(endpointId?: string): Promise<WebhookEvent[]> {
    const url = endpointId ? `${API_BASE}/events?endpointId=${endpointId}` : `${API_BASE}/events`;
    const res = await fetch(url);
    const data = await res.json();
    return data.events || [];
  },

  async getEvent(id: string): Promise<WebhookEvent> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch event');
    return data.event;
  },

  async clearEvents(endpointId?: string): Promise<boolean> {
    const url = endpointId ? `${API_BASE}/events?endpointId=${endpointId}` : `${API_BASE}/events`;
    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  async replayWebhook(params: {
    targetUrl: string;
    method: string;
    headers: Record<string, string>;
    body: any;
    eventId?: string;
  }): Promise<ForwardResponse> {
    const isLocal = params.targetUrl.includes('localhost') || params.targetUrl.includes('127.0.0.1');

    // ── Mode 1: HookFlow LocalBridge™ Browser-Direct Relay ──────────────────────
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
