import { GoogleGenAI } from '@google/genai';
import { SchemaSynthesisResult } from './types.js';

// Helper: capitalizes first letter
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper: sanitize variable/type names
function sanitizeIdentifier(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_$]/g, '_');
  if (/^[0-9]/.test(cleaned)) {
    return `_${cleaned}`;
  }
  return cleaned || 'Item';
}

// 1. Offline Intelligent Type Synthesizer
export function synthesizeOfflineSchema(
  payload: any,
  rootName: string = 'WebhookPayload',
  providerHint: string = 'Webhook'
): SchemaSynthesisResult {
  if (typeof payload !== 'object' || payload === null) {
    return {
      typescript: `export type ${rootName} = ${typeof payload || 'unknown'};\n`,
      zod: `import { z } from 'zod';\n\nexport const ${rootName}Schema = z.${typeof payload === 'number' ? 'number()' : typeof payload === 'boolean' ? 'boolean()' : 'string()'};\nexport type ${rootName} = z.infer<typeof ${rootName}Schema>;`,
      pythonPydantic: `from pydantic import BaseModel, AnyHttpUrl\n\n# Primitive type\n${rootName} = ${typeof payload === 'number' ? 'float' : typeof payload === 'boolean' ? 'bool' : 'str'}\n`,
      goStruct: `type ${rootName} ${typeof payload === 'number' ? 'float64' : typeof payload === 'boolean' ? 'bool' : 'string'}\n`,
      verificationSnippet: generateVerificationSnippets(providerHint),
      insights: {
        title: `${providerHint} Event Payload`,
        detectedProvider: providerHint,
        fieldCount: 1,
        hasPII: false,
        piiFields: [],
        summary: `Primitive ${typeof payload} payload.`
      }
    };
  }

  const generatedInterfaces: { name: string; content: string }[] = [];
  const generatedZodSchemas: { name: string; content: string }[] = [];
  const generatedPythonModels: { name: string; content: string }[] = [];
  const generatedGoStructs: { name: string; content: string }[] = [];
  const seenTypes = new Set<string>();
  const piiFields: string[] = [];
  let totalFields = 0;

  function isPII(key: string): boolean {
    const lower = key.toLowerCase();
    return lower.includes('email') ||
      lower.includes('password') ||
      lower.includes('token') ||
      lower.includes('secret') ||
      lower.includes('ssn') ||
      lower.includes('phone') ||
      lower.includes('credit_card') ||
      lower.includes('card_number') ||
      lower.includes('address') ||
      lower.includes('ip_address');
  }

  function processObject(obj: Record<string, any>, typeName: string): {
    tsType: string;
    zodType: string;
    pyType: string;
    goType: string;
  } {
    if (seenTypes.has(typeName)) {
      typeName = `${typeName}_${Math.random().toString(36).substring(2, 6)}`;
    }
    seenTypes.add(typeName);

    const tsLines: string[] = [];
    const zodLines: string[] = [];
    const pyLines: string[] = [];
    const goLines: string[] = [];

    const keys = Object.keys(obj);
    totalFields += keys.length;

    for (const key of keys) {
      const val = obj[key];
      const safeKey = sanitizeIdentifier(key);
      const isOptional = val === null || val === undefined;

      if (isPII(key)) {
        if (!piiFields.includes(key)) piiFields.push(key);
      }

      if (val === null || val === undefined) {
        tsLines.push(`  ${safeKey}?: any | null;`);
        zodLines.push(`  ${safeKey}: z.any().nullable().optional(),`);
        pyLines.push(`    ${safeKey}: Optional[Any] = None`);
        goLines.push(`\t${capitalize(safeKey)} *interface{} \`json:"${key},omitempty"\``);
      } else if (Array.isArray(val)) {
        if (val.length === 0) {
          tsLines.push(`  ${safeKey}: any[];`);
          zodLines.push(`  ${safeKey}: z.array(z.any()),`);
          pyLines.push(`    ${safeKey}: List[Any] = Field(default_factory=list)`);
          goLines.push(`\t${capitalize(safeKey)} []interface{} \`json:"${key}"\``);
        } else if (typeof val[0] === 'object' && val[0] !== null) {
          const nestedName = `${capitalize(typeName)}${capitalize(safeKey)}Item`;
          const nestedResult = processObject(val[0], nestedName);
          tsLines.push(`  ${safeKey}: ${nestedName}[];`);
          zodLines.push(`  ${safeKey}: z.array(${nestedName}Schema),`);
          pyLines.push(`    ${safeKey}: List[${nestedName}] = Field(default_factory=list)`);
          goLines.push(`\t${capitalize(safeKey)} []${nestedName} \`json:"${key}"\``);
        } else {
          const primType = typeof val[0];
          const tsPrim = primType === 'number' ? 'number' : primType === 'boolean' ? 'boolean' : 'string';
          const zodPrim = primType === 'number' ? 'z.number()' : primType === 'boolean' ? 'z.boolean()' : 'z.string()';
          const pyPrim = primType === 'number' ? 'float' : primType === 'boolean' ? 'bool' : 'str';
          const goPrim = primType === 'number' ? 'float64' : primType === 'boolean' ? 'bool' : 'string';

          tsLines.push(`  ${safeKey}: ${tsPrim}[];`);
          zodLines.push(`  ${safeKey}: z.array(${zodPrim}),`);
          pyLines.push(`    ${safeKey}: List[${pyPrim}] = Field(default_factory=list)`);
          goLines.push(`\t${capitalize(safeKey)} []${goPrim} \`json:"${key}"\``);
        }
      } else if (typeof val === 'object') {
        const nestedName = `${capitalize(typeName)}${capitalize(safeKey)}`;
        processObject(val, nestedName);
        tsLines.push(`  ${safeKey}: ${nestedName};`);
        zodLines.push(`  ${safeKey}: ${nestedName}Schema,`);
        pyLines.push(`    ${safeKey}: ${nestedName}`);
        goLines.push(`\t${capitalize(safeKey)} ${nestedName} \`json:"${key}"\``);
      } else if (typeof val === 'number') {
        tsLines.push(`  ${safeKey}: number;`);
        zodLines.push(`  ${safeKey}: z.number(),`);
        pyLines.push(`    ${safeKey}: float`);
        goLines.push(`\t${capitalize(safeKey)} float64 \`json:"${key}"\``);
      } else if (typeof val === 'boolean') {
        tsLines.push(`  ${safeKey}: boolean;`);
        zodLines.push(`  ${safeKey}: z.boolean(),`);
        pyLines.push(`    ${safeKey}: bool`);
        goLines.push(`\t${capitalize(safeKey)} bool \`json:"${key}"\``);
      } else {
        // String handling - detect email / uuid / url / date
        const strVal = String(val);
        let zodValidator = 'z.string()';
        if (key.toLowerCase().includes('email') && strVal.includes('@')) {
          zodValidator = 'z.string().email()';
        } else if (key.toLowerCase().includes('url') && strVal.startsWith('http')) {
          zodValidator = 'z.string().url()';
        } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strVal)) {
          zodValidator = 'z.string().uuid()';
        } else if (!isNaN(Date.parse(strVal)) && strVal.length > 10) {
          zodValidator = 'z.string().datetime().optional().or(z.string())';
        }

        tsLines.push(`  ${safeKey}: string;`);
        zodLines.push(`  ${safeKey}: ${zodValidator},`);
        pyLines.push(`    ${safeKey}: str`);
        goLines.push(`\t${capitalize(safeKey)} string \`json:"${key}"\``);
      }
    }

    generatedInterfaces.unshift({
      name: typeName,
      content: `export interface ${typeName} {\n${tsLines.join('\n')}\n}`
    });

    generatedZodSchemas.unshift({
      name: `${typeName}Schema`,
      content: `export const ${typeName}Schema = z.object({\n${zodLines.join('\n')}\n});`
    });

    generatedPythonModels.unshift({
      name: typeName,
      content: `class ${typeName}(BaseModel):\n${pyLines.length > 0 ? pyLines.join('\n') : '    pass'}`
    });

    generatedGoStructs.unshift({
      name: typeName,
      content: `type ${typeName} struct {\n${goLines.join('\n')}\n}`
    });

    return {
      tsType: typeName,
      zodType: `${typeName}Schema`,
      pyType: typeName,
      goType: typeName
    };
  }

  processObject(payload, rootName);

  const fullTypeScript = `/**\n * Auto-generated TypeScript Definitions by HookFlow\n * Synthesized for: ${providerHint}\n */\n\n` +
    generatedInterfaces.map(i => i.content).join('\n\n') +
    `\n\nexport type ${rootName}Event = ${rootName};`;

  const fullZod = `import { z } from 'zod';\n\n/**\n * Auto-generated Zod Validation Schemas by HookFlow\n */\n\n` +
    generatedZodSchemas.map(s => s.content).join('\n\n') +
    `\n\nexport type ${rootName} = z.infer<typeof ${rootName}Schema>;`;

  const fullPython = `from typing import Optional, List, Any\nfrom pydantic import BaseModel, Field\n\n` +
    generatedPythonModels.map(m => m.content).join('\n\n');

  const fullGo = `package main\n\nimport "time"\n\n` +
    generatedGoStructs.map(s => s.content).join('\n\n');

  return {
    typescript: fullTypeScript,
    zod: fullZod,
    pythonPydantic: fullPython,
    goStruct: fullGo,
    verificationSnippet: generateVerificationSnippets(providerHint),
    insights: {
      title: `${providerHint} Ingestion Schema`,
      detectedProvider: providerHint,
      fieldCount: totalFields,
      hasPII: piiFields.length > 0,
      piiFields,
      summary: `Synthesized ${totalFields} fields across ${generatedInterfaces.length} nested interfaces. ${piiFields.length > 0 ? `Detected ${piiFields.length} potential PII fields: ${piiFields.join(', ')}.` : 'No sensitive credentials detected.'}`
    }
  };
}

// 2. Webhook Verification Snippet Generator
function generateVerificationSnippets(provider: string) {
  const prov = provider.toLowerCase();
  
  if (prov.includes('stripe')) {
    return {
      express: `// Express.js Stripe Webhook Handler with Signature Verification
import express from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const app = express();

// IMPORTANT: Webhook endpoint needs raw body
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
  } catch (err: any) {
    console.error(\`Webhook signature verification failed: \${err.message}\`);
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle verified event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }

  res.json({ received: true });
});`,
      nextjs: `// Next.js App Router (app/api/webhooks/stripe/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(body, signature!, endpointSecret);
    console.log('Verified Stripe Event:', event.type);
    
    // Process event...
    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}`
    };
  } else if (prov.includes('github')) {
    return {
      express: `// Express.js GitHub Webhook Handler
import express from 'express';
import crypto from 'crypto';

const app = express();

app.post('/api/webhooks/github', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;

  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expectedSignature))) {
    return res.status(401).send('Signatures did not match');
  }

  const payload = JSON.parse(req.body.toString());
  console.log('Received GitHub event:', req.headers['x-github-event'], payload);
  res.status(200).send('OK');
});`,
      nextjs: `// Next.js App Router (app/api/webhooks/github/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;

  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  return NextResponse.json({ success: true });
}`
    };
  } else if (prov.includes('clerk')) {
    return {
      express: `// Express.js Clerk / Svix Webhook Handler
import express from 'express';
import { Webhook } from 'svix';

const app = express();

app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;
  const wh = new Webhook(WEBHOOK_SECRET);

  const headers = {
    'svix-id': req.headers['svix-id'] as string,
    'svix-timestamp': req.headers['svix-timestamp'] as string,
    'svix-signature': req.headers['svix-signature'] as string,
  };

  try {
    const evt = wh.verify(req.body.toString(), headers);
    console.log('Clerk verified payload:', evt);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});`,
      nextjs: `// Next.js App Router (app/api/webhooks/clerk/route.ts)
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const headerPayload = headers();
  const svix_id = (await headerPayload).get('svix-id');
  const svix_timestamp = (await headerPayload).get('svix-timestamp');
  const svix_signature = (await headerPayload).get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }
}`
    };
  }

  // Generic HMAC-SHA256
  return {
    express: `// Express.js HMAC-SHA256 Webhook Verification
import express from 'express';
import crypto from 'crypto';

const app = express();

app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-signature'] as string;
  const secret = process.env.WEBHOOK_SECRET!;

  const computedHash = crypto.createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (signature !== computedHash) {
    return res.status(401).json({ error: 'Signature mismatch' });
  }

  const payload = JSON.parse(req.body.toString());
  res.status(200).json({ received: true });
});`,
    nextjs: `// Next.js App Router (app/api/webhook/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');
  const secret = process.env.WEBHOOK_SECRET!;

  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (signature !== computed) {
    return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
  }

  const data = JSON.parse(rawBody);
  return NextResponse.json({ success: true });
}`
  };
}

// 3. Google Gemini AI Engine
export async function synthesizeWithGemini(
  payload: any,
  apiKey?: string,
  providerHint: string = 'Webhook'
): Promise<SchemaSynthesisResult> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    // Fall back immediately to high-quality offline synthesizer
    return synthesizeOfflineSchema(payload, 'WebhookPayload', providerHint);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    
    const prompt = `You are a Principal Software Architect and Webhook Security Expert.
Given the following raw webhook JSON payload from provider: "${providerHint}", analyze it and generate:
1. Complete, production-grade TypeScript definitions (use clear names, JSDoc comments, union types where appropriate).
2. Complete Zod schema with proper constraints (e.g. .email(), .uuid(), .url(), .datetime(), .optional(), .nullable()).
3. Python Pydantic V2 BaseModel definitions.
4. Go struct definitions with json tags.
5. High-level security insights: list of PII/sensitive fields, security summary, and recommended signature headers.

Return the response in strictly valid JSON matching this format:
{
  "typescript": "string containing TS code",
  "zod": "string containing Zod code",
  "pythonPydantic": "string containing Python Pydantic code",
  "goStruct": "string containing Go struct code",
  "insights": {
    "title": "string",
    "detectedProvider": "string",
    "fieldCount": number,
    "hasPII": boolean,
    "piiFields": ["field1", "field2"],
    "summary": "string summary"
  }
}

RAW WEBHOOK JSON PAYLOAD:
${JSON.stringify(payload, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return {
      typescript: parsed.typescript || '',
      zod: parsed.zod || '',
      pythonPydantic: parsed.pythonPydantic || '',
      goStruct: parsed.goStruct || '',
      verificationSnippet: generateVerificationSnippets(providerHint),
      insights: parsed.insights || {
        title: `${providerHint} Schema`,
        detectedProvider: providerHint,
        fieldCount: Object.keys(payload || {}).length,
        hasPII: false,
        piiFields: [],
        summary: 'Synthesized with Gemini 2.5 Flash.'
      }
    };
  } catch (err: any) {
    console.warn('[AI] Gemini generation failed, falling back to offline synthesizer:', err.message);
    return synthesizeOfflineSchema(payload, 'WebhookPayload', providerHint);
  }
}
