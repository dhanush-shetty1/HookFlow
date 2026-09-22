import axios from 'axios';
import { ForwardResponse, ReplayRequest } from './types.js';

export async function forwardWebhook(
  targetUrl: string,
  method: string,
  headers: Record<string, any>,
  body: any,
  rawBody?: string
): Promise<ForwardResponse> {
  const startTime = performance.now();
  
  // Clean headers to avoid host conflicts or compression mismatches
  const forwardHeaders: Record<string, string> = {};
  const blockedHeaders = new Set(['host', 'content-length', 'connection', 'accept-encoding']);

  for (const [k, v] of Object.entries(headers)) {
    if (!blockedHeaders.has(k.toLowerCase()) && v !== undefined) {
      forwardHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v);
    }
  }

  // Ensure content-type exists if body exists
  if (!forwardHeaders['content-type'] && !forwardHeaders['Content-Type']) {
    forwardHeaders['content-type'] = 'application/json';
  }

  // Add HookFlow forwarder indicator
  forwardHeaders['x-forwarded-by'] = 'HookFlow/1.0';

  let dataToSend = body;
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    dataToSend = body;
  } else if (rawBody && typeof rawBody === 'string') {
    dataToSend = rawBody;
  }

  try {
    const response = await axios({
      url: targetUrl,
      method: (method || 'POST').toUpperCase() as any,
      headers: forwardHeaders,
      data: dataToSend,
      timeout: 10000,
      validateStatus: () => true // capture any status code (200, 400, 500)
    });

    const duration = Math.round(performance.now() - startTime);

    // Filter response headers
    const respHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(response.headers)) {
      if (typeof v === 'string') {
        respHeaders[k] = v;
      } else if (Array.isArray(v)) {
        respHeaders[k] = v.join(', ');
      }
    }

    return {
      statusCode: response.status,
      statusText: response.statusText || 'OK',
      timeMs: duration,
      headers: respHeaders,
      body: response.data
    };
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);
    return {
      statusCode: 0,
      statusText: 'Connection Error',
      timeMs: duration,
      headers: {},
      body: null,
      error: err.code === 'ECONNREFUSED' 
        ? `Connection refused at ${targetUrl}. Is your local server running on that port?`
        : err.message
    };
  }
}
