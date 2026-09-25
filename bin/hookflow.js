#!/usr/bin/env node

import WebSocket from 'ws';
import http from 'http';
import https from 'https';

// HookFlow LocalBridge™ CLI Daemon (Mode 2: Headless WebSocket Relay)
// Usage: npx hookflow listen --forward http://localhost:5000/api/webhook/donation

const args = process.argv.slice(2);

function getArg(flag, defaultVal = null) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultVal;
}

const command = args[0];

if (command !== 'listen' && !args.includes('--help') && !args.includes('-h')) {
  console.log(`
⚡ HookFlow LocalBridge™ (Zero-Tunnel Local Relay Daemon)

Commands:
  hookflow listen   Establishes a live WebSocket bridge to stream cloud webhooks to localhost

Flags:
  --forward <url>   Local destination URL (default: http://localhost:5000)
  --server <url>    HookFlow server URL (default: ws://localhost:4000)
  --endpoint <id>   Optional endpoint ID filter

Example:
  npx hookflow listen --forward http://localhost:5000/api/webhook/donation
`);
  process.exit(0);
}

const forwardUrl = getArg('--forward', 'http://localhost:5000');
const serverUrl = getArg('--server', 'ws://localhost:4000').replace(/^http/, 'ws');
const endpointFilter = getArg('--endpoint', null);

console.log(`
=============================================================
⚡ HookFlow LocalBridge™ Daemon Active
=============================================================
🔗 Cloud Server:    ${serverUrl}
🎯 Local Forward:   ${forwardUrl}
📌 Endpoint Filter: ${endpointFilter || 'All Endpoints'}
=============================================================
Connecting to HookFlow event bus...
`);

let ws;

function connect() {
  ws = new WebSocket(serverUrl);

  ws.on('open', () => {
    console.log('✅ Connected to HookFlow Event Bus. Waiting for webhooks...\n');
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'NEW_EVENT') {
        const event = message.data;
        if (endpointFilter && event.endpointId !== endpointFilter) return;

        const start = Date.now();
        console.log(`📥 [Incoming Webhook] Event #${event.id.slice(0, 8)} (${event.method} /hook/${event.endpointId})`);
        console.log(`   HMAC Verification: ${event.signatureStatus ? event.signatureStatus.toUpperCase() : 'N/A'}`);
        console.log(`   Forwarding to ${forwardUrl}...`);

        // Forward to local target
        try {
          const bodyStr = typeof event.body === 'string' ? event.body : JSON.stringify(event.body || {});
          const parsedTarget = new URL(forwardUrl);
          const reqModule = parsedTarget.protocol === 'https:' ? https : http;

          const req = reqModule.request(forwardUrl, {
            method: event.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-forwarded-by': 'HookFlow-LocalBridge/1.0',
              ...(event.headers || {})
            }
          }, (res) => {
            let respBody = '';
            res.on('data', chunk => respBody += chunk);
            res.on('end', () => {
              const latency = Date.now() - start;
              const statusSymbol = res.statusCode >= 200 && res.statusCode < 400 ? '✅' : '❌';
              console.log(`   ${statusSymbol} Local Response: ${res.statusCode} ${res.statusMessage || ''} (${latency}ms)\n`);
            });
          });

          req.on('error', (err) => {
            console.error(`   ❌ Failed to deliver to ${forwardUrl}: ${err.message}`);
            console.error(`      Tip: Make sure your local application is running on port ${parsedTarget.port || 80}\n`);
          });

          req.write(bodyStr);
          req.end();
        } catch (err) {
          console.error(`   ❌ Error executing local request: ${err.message}\n`);
        }
      }
    } catch {
      // ignore non-json
    }
  });

  ws.on('close', () => {
    console.log('⚠️ Disconnected from HookFlow Event Bus. Reconnecting in 3s...');
    setTimeout(connect, 3000);
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
  });
}

connect();
