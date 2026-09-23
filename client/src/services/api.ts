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
