import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Play, 
  AlertCircle, 
  FileText, 
  Layers, 
  Zap, 
  Eye, 
  EyeOff,
  Code2,
  Wand2,
  Webhook
} from 'lucide-react';
import { WebhookEvent, Endpoint, SchemaSynthesisResult, ForwardResponse } from '../types';
import { api } from '../services/api';
import { CodeBlock } from './ui/CodeBlock';

interface EventDetailProps {
  event: WebhookEvent | null;
  endpoint: Endpoint | null;
  onEventUpdated?: (updated: WebhookEvent) => void;
}

const getProviderMeta = (event: WebhookEvent) => {
  const headers = event.headers || {};
  const path = (event.path || '').toLowerCase();
  const bodyStr = typeof event.body === 'object' ? JSON.stringify(event.body).toLowerCase() : '';

  if (headers['stripe-signature'] || path.includes('stripe') || bodyStr.includes('payment_intent')) {
    return { name: 'Stripe', color: '#635bff', bg: 'rgba(99, 91, 255, 0.15)', border: 'rgba(99, 91, 255, 0.4)' };
  }
  if (headers['x-hub-signature-256'] || headers['x-github-event'] || path.includes('github') || bodyStr.includes('commits')) {
    return { name: 'GitHub', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)' };
  }
  if (headers['x-shopify-hmac-sha256'] || path.includes('shopify') || bodyStr.includes('total_price')) {
    return { name: 'Shopify', color: '#95bf47', bg: 'rgba(149, 191, 71, 0.15)', border: 'rgba(149, 191, 71, 0.4)' };
  }
  if (headers['svix-signature'] || path.includes('clerk') || bodyStr.includes('user_2n')) {
    return { name: 'Clerk', color: '#6c47ff', bg: 'rgba(108, 71, 255, 0.15)', border: 'rgba(108, 71, 255, 0.4)' };
  }
  if (headers['x-twilio-signature'] || path.includes('twilio')) {
    return { name: 'Twilio', color: '#f22f46', bg: 'rgba(242, 47, 70, 0.15)', border: 'rgba(242, 47, 70, 0.4)' };
  }
  if (headers['x-slack-signature'] || path.includes('slack')) {
    return { name: 'Slack', color: '#ecb22e', bg: 'rgba(236, 178, 46, 0.15)', border: 'rgba(236, 178, 46, 0.4)' };
  }
  if (headers['x-signature-ed25519'] || path.includes('discord')) {
    return { name: 'Discord', color: '#5865f2', bg: 'rgba(88, 101, 242, 0.15)', border: 'rgba(88, 101, 242, 0.4)' };
  }
  return { name: 'Webhook', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' };
};

export const EventDetail: React.FC<EventDetailProps> = ({
  event,
  endpoint,
  onEventUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'payload' | 'headers' | 'schema' | 'replayer' | 'signature'>('payload');
  const [schemaLanguage, setSchemaLanguage] = useState<'typescript' | 'zod' | 'python' | 'go' | 'nextjs' | 'express'>('typescript');
  
  // Replayer state
  const [replayUrl, setReplayUrl] = useState('');
  const [replayMethod, setReplayMethod] = useState('POST');
  const [replayHeaders, setReplayHeaders] = useState('');
  const [replayBody, setReplayBody] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<ForwardResponse | null>(null);

  // Schema state
  const [synthesisResult, setSynthesisResult] = useState<SchemaSynthesisResult | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // UI state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isRawPayload, setIsRawPayload] = useState(false);

  // Sync event changes
  useEffect(() => {
    if (event) {
      const defaultTarget = endpoint?.forwardUrl || 'http://localhost:3000/api/webhooks';
      setReplayUrl(defaultTarget);
      setReplayMethod(event.method || 'POST');

      const cleanHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(event.headers)) {
        if (v !== undefined && !['host', 'content-length', 'connection'].includes(k.toLowerCase())) {
          cleanHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v);
        }
      }
      setReplayHeaders(JSON.stringify(cleanHeaders, null, 2));

      const bodyStr = typeof event.body === 'object' ? JSON.stringify(event.body, null, 2) : String(event.rawBody || '');
      setReplayBody(bodyStr);

      if (event.forwardResponse) {
        setReplayResult(event.forwardResponse);
      } else {
        setReplayResult(null);
      }

      handleAutoSynthesize(event.body || event.rawBody, false);
    }
  }, [event?.id]);

  const handleAutoSynthesize = async (payload: any, gemini = false) => {
    if (!payload) return;
    setIsSynthesizing(true);
    try {
      const savedApiKey = localStorage.getItem('hookflow_gemini_key') || undefined;
      const provider = endpoint?.signatureProvider || 'Webhook';
      const result = await api.synthesizeSchema({
        payload: typeof payload === 'string' ? JSON.parse(payload) : payload,
        apiKey: savedApiKey,
        providerHint: provider === 'auto' ? 'Generic Webhook' : provider.toUpperCase(),
        useGemini: gemini || !!savedApiKey
      });
      setSynthesisResult(result);
    } catch {
      // ignore
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#71717a] p-8 h-[calc(100vh-56px)] bg-black font-mono">
        <div className="w-14 h-14 rounded-xl bg-[#0a0a0a] border border-[#222222] flex items-center justify-center mb-3 text-white shadow-lg">
          <Webhook className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">No Request Selected</h3>
        <p className="text-xs text-[#71717a] mt-1 max-w-sm text-center leading-relaxed">
          Select a request from the sidebar to inspect raw payload, headers, HMAC signature verification, and synthesize schemas.
        </p>
      </div>
    );
  }

  const generateCurlCommand = () => {
    let curl = `curl -X ${event.method} "${event.path.startsWith('http') ? event.path : `http://localhost:4000${event.path}`}" \\\n`;
    for (const [k, v] of Object.entries(event.headers)) {
      if (v !== undefined && !['host', 'content-length'].includes(k.toLowerCase())) {
        curl += `  -H "${k}: ${Array.isArray(v) ? v.join(', ') : v}" \\\n`;
      }
    }
    if (event.rawBody) {
      curl += `  -d '${event.rawBody.replace(/'/g, `'\\''`)}'`;
    }
    return curl;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurlCommand());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleReplay = async () => {
    if (!replayUrl) return;
    setIsReplaying(true);
    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(replayHeaders);
      } catch {
        parsedHeaders = {};
      }

      let parsedBody = replayBody;
      try {
        parsedBody = JSON.parse(replayBody);
      } catch {
        // use as string
      }

      const res = await api.replayWebhook({
        targetUrl: replayUrl,
        method: replayMethod,
        headers: parsedHeaders,
        body: parsedBody,
        eventId: event.id
      });
      setReplayResult(res);
      if (onEventUpdated) {
        onEventUpdated({
          ...event,
          forwardResponse: res,
          forwardStatus: res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failed'
        });
      }
    } catch (err: any) {
      setReplayResult({
        statusCode: 0,
        statusText: 'Error',
        timeMs: 0,
        headers: {},
        body: null,
        error: err.message
      });
    } finally {
      setIsReplaying(false);
    }
  };

  const currentSchemaCode = () => {
    if (!synthesisResult) return '// Synthesizing schema...';
    switch (schemaLanguage) {
      case 'typescript': return synthesisResult.typescript;
      case 'zod': return synthesisResult.zod;
      case 'python': return synthesisResult.pythonPydantic;
      case 'go': return synthesisResult.goStruct;
      case 'nextjs': return synthesisResult.verificationSnippet?.nextjs || '// No snippet available';
      case 'express': return synthesisResult.verificationSnippet?.express || '// No snippet available';
      default: return synthesisResult.typescript;
    }
  };

  const prov = getProviderMeta(event);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] bg-black overflow-hidden font-mono text-[#e4e4e7]">
      {/* Event Header Banner */}
      <div className="p-3.5 border-b border-[#222222] bg-black flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#0a0a0a] border border-[#222222] text-white uppercase">
            {event.method}
          </span>
          <span
            className="px-2 py-0.5 rounded text-xs font-mono font-semibold border flex items-center gap-1.5"
            style={{
              color: prov.color,
              backgroundColor: prov.bg,
              borderColor: prov.border,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: prov.color }} />
            {prov.name}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-white">{event.path}</span>
              <span className="text-[11px] text-[#71717a] font-mono">({event.id})</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#71717a] font-mono mt-0.5">
              <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
              <span>•</span>
              <span>{event.clientIp}</span>
              <span>•</span>
              <span>{event.sizeBytes > 1024 ? `${(event.sizeBytes / 1024).toFixed(1)} KB` : `${event.sizeBytes} B`}</span>
            </div>
          </div>
        </div>

        {/* Status badges & Actions */}
        <div className="flex items-center gap-2">
          {event.signatureStatus === 'verified' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#222222] text-[#4ade80] text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          )}
          {event.signatureStatus === 'failed' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#222222] text-[#f87171] text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Invalid Signature</span>
            </div>
          )}
          {event.signatureStatus === 'missing_secret' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#222222] text-[#fbbf24] text-xs font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>No Secret</span>
            </div>
          )}

          {event.forwardResponse && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-medium border bg-[#0a0a0a] ${
              event.forwardResponse.statusCode >= 200 && event.forwardResponse.statusCode < 400
                ? 'text-[#4ade80] border-[#222222]'
                : 'text-[#f87171] border-[#222222]'
            }`}>
              <span>Forward: {event.forwardResponse.statusCode || 'ERR'}</span>
              <span className="text-[10px] text-[#71717a]">({event.forwardResponse.timeMs}ms)</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab('replayer')}
            className="btn primary text-xs py-1.5 px-3.5 font-bold"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Replay</span>
          </button>

          <button
            onClick={handleCopyCurl}
            className="btn text-xs py-1.5 px-3"
            title="Copy cURL"
          >
            {copiedCurl ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Terminal className="w-3 h-3" />}
            <span className="hidden md:inline">{copiedCurl ? 'Copied' : 'cURL'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#222222] bg-black px-4 py-2 flex items-center gap-1 select-none">
        <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#222222] p-0.5 rounded-md text-xs">
          <button
            onClick={() => setActiveTab('payload')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'payload'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Payload</span>
          </button>

          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'headers'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Headers ({Object.keys(event.headers).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'schema'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Schema Synthesizer</span>
          </button>

          <button
            onClick={() => setActiveTab('replayer')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'replayer'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Replayer</span>
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'signature'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Signature</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 bg-black">
        {/* Tab: Payload */}
        {activeTab === 'payload' && (
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-[#71717a]">
                Inbound Payload ({typeof event.body === 'object' && event.body ? `${Object.keys(event.body).length} root keys` : 'raw'})
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRawPayload(!isRawPayload)}
                  className="btn text-xs py-1 px-2.5"
                >
                  {isRawPayload ? 'Formatted' : 'Raw'}
                </button>
                <button
                  onClick={() => handleCopyCode(typeof event.body === 'object' ? JSON.stringify(event.body, null, 2) : event.rawBody)}
                  className="btn text-xs py-1 px-2.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <CodeBlock
              code={isRawPayload 
                ? (event.rawBody || '') 
                : (typeof event.body === 'object' ? JSON.stringify(event.body, null, 2) : event.rawBody || '{}')}
              language="json"
              filename={isRawPayload ? 'raw_payload.txt' : 'payload.json'}
              showLineNumbers={true}
              showDots={true}
              maxHeight="max-h-[500px]"
            />
          </div>
        )}

        {/* Tab: Headers & Query */}
        {activeTab === 'headers' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-[#71717a]">
                  HTTP Request Headers ({Object.keys(event.headers).length})
                </div>
                <button
                  onClick={() => handleCopyCode(JSON.stringify(event.headers, null, 2))}
                  className="text-xs text-[#71717a] hover:text-white"
                >
                  Copy JSON
                </button>
              </div>
              <div className="border border-[#222222] rounded-lg overflow-hidden bg-[#0a0a0a] font-mono text-xs divide-y divide-[#222222]">
                {Object.entries(event.headers).map(([key, val]) => (
                  <div key={key} className="flex items-start p-2.5 hover:bg-[#141414] transition-colors">
                    <div className="w-1/3 min-w-[180px] font-medium text-[#71717a] select-all pr-2">{key}</div>
                    <div className="flex-1 text-white break-all select-all">
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {event.query && Object.keys(event.query).length > 0 && (
              <div>
                <div className="text-xs font-medium text-[#71717a] mb-2">
                  URL Query Parameters ({Object.keys(event.query).length})
                </div>
                <div className="border border-[#222222] rounded-lg overflow-hidden bg-[#0a0a0a] font-mono text-xs divide-y divide-[#222222]">
                  {Object.entries(event.query).map(([key, val]) => (
                    <div key={key} className="flex items-start p-2.5 hover:bg-[#141414]">
                      <div className="w-1/3 min-w-[180px] font-medium text-[#71717a] select-all">{key}</div>
                      <div className="flex-1 text-white break-all select-all">{String(val)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: AI Schema Synthesizer */}
        {activeTab === 'schema' && (
          <div className="space-y-4">
            {synthesisResult?.insights && (
              <div className="p-3.5 rounded-lg border border-[#222222] bg-[#0a0a0a] flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">
                      {synthesisResult.insights.title || 'Synthesized Schema'}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black text-white border border-[#222222]">
                      {synthesisResult.insights.detectedProvider}
                    </span>
                    {synthesisResult.insights.hasPII && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        PII: {synthesisResult.insights.piiFields.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    {synthesisResult.insights.summary}
                  </p>
                </div>
                <button
                  onClick={() => handleAutoSynthesize(event.body, true)}
                  disabled={isSynthesizing}
                  className="btn primary text-xs py-1.5 px-3 shrink-0 font-bold"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize with Gemini'}</span>
                </button>
              </div>
            )}

            {/* Language Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222222] pb-2">
              <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-[#222222] p-0.5 rounded-md text-xs">
                {(['typescript', 'zod', 'python', 'go', 'nextjs', 'express'] as const).map((lang) => {
                  const isSelected = schemaLanguage === lang;
                  const langColorClass = () => {
                    if (!isSelected) return 'text-[#71717a] hover:text-white';
                    switch (lang) {
                      case 'typescript': return 'text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/40 font-semibold';
                      case 'zod': return 'text-[#818cf8] bg-[#818cf8]/15 border border-[#818cf8]/40 font-semibold';
                      case 'python': return 'text-[#facc15] bg-[#facc15]/15 border border-[#facc15]/40 font-semibold';
                      case 'go': return 'text-[#22d3ee] bg-[#22d3ee]/15 border border-[#22d3ee]/40 font-semibold';
                      case 'nextjs': return 'text-white bg-white/15 border border-white/40 font-semibold';
                      case 'express': return 'text-white bg-white/15 border border-white/40 font-semibold';
                      default: return 'text-white bg-white/15 border border-white/40 font-semibold';
                    }
                  };

                  return (
                    <button
                      key={lang}
                      onClick={() => setSchemaLanguage(lang)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${langColorClass()}`}
                    >
                      {lang === 'nextjs' ? 'Next.js' : lang === 'express' ? 'Express' : lang}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handleCopyCode(currentSchemaCode())}
                className="btn text-xs py-1.5 px-3"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Box */}
            <CodeBlock
              code={currentSchemaCode()}
              language={schemaLanguage}
              filename={`synthesized-schema.${schemaLanguage === 'typescript' ? 'ts' : schemaLanguage === 'zod' ? 'ts' : schemaLanguage === 'python' ? 'py' : schemaLanguage === 'go' ? 'go' : 'ts'}`}
              showLineNumbers={true}
              showDots={true}
              maxHeight="max-h-[500px]"
            />
          </div>
        )}

        {/* Tab: Replayer & Forwarder Studio */}
        {activeTab === 'replayer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-[#71717a] mb-1">Method</label>
                <select
                  value={replayMethod}
                  onChange={(e) => setReplayMethod(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222222] rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-white"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#71717a]">Destination URL</label>
                  {(replayUrl.includes('localhost') || replayUrl.includes('127.0.0.1')) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#4ade80] bg-[#0a0a0a] border border-[#222222] px-2 py-0.5 rounded-full">
                      <Zap className="w-2.5 h-2.5" /> LocalBridge (Direct)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replayUrl}
                    onChange={(e) => setReplayUrl(e.target.value)}
                    placeholder="http://localhost:3000/api/webhooks"
                    className="flex-1 bg-[#0a0a0a] border border-[#222222] rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-white"
                  />
                  <button
                    onClick={handleReplay}
                    disabled={isReplaying || !replayUrl}
                    className="btn primary text-xs py-1.5 px-4 shrink-0 font-bold"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isReplaying ? 'Broadcasting...' : 'Replay'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Editable Request Headers & Body */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#71717a] mb-1">Request Headers (JSON)</label>
                <textarea
                  rows={8}
                  value={replayHeaders}
                  onChange={(e) => setReplayHeaders(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 font-mono text-xs text-white focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#71717a] mb-1">Request Body (JSON / Raw)</label>
                <textarea
                  rows={8}
                  value={replayBody}
                  onChange={(e) => setReplayBody(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 font-mono text-xs text-white focus:outline-none focus:border-white resize-none"
                />
              </div>
            </div>

            {/* Response Viewer */}
            {replayResult && (
              <div className="border border-[#222222] rounded-lg overflow-hidden bg-[#0a0a0a]">
                <div className="p-3 bg-[#0a0a0a] border-b border-[#222222] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#71717a]">Response:</span>
                    <span className={`font-semibold ${
                      replayResult.statusCode >= 200 && replayResult.statusCode < 400
                        ? 'text-[#4ade80]'
                        : 'text-[#f87171]'
                    }`}>
                      {replayResult.statusCode} {replayResult.statusText}
                    </span>
                    <span className="text-[#71717a]">({replayResult.timeMs}ms)</span>
                  </div>

                  {replayResult.error && (
                    <span className="text-xs text-[#f87171] font-mono">{replayResult.error}</span>
                  )}
                </div>

                <CodeBlock
                  code={typeof replayResult.body === 'object' && replayResult.body !== null
                    ? JSON.stringify(replayResult.body, null, 2)
                    : String(replayResult.body || (replayResult.error ? 'No response payload' : 'Empty body'))}
                  language="json"
                  filename={`response-${replayResult.statusCode}.json`}
                  showLineNumbers={true}
                  showDots={true}
                  maxHeight="max-h-60"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab: Signature Verifier */}
        {activeTab === 'signature' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg border border-[#222222] bg-[#0a0a0a] flex items-start gap-3">
              {event.signatureStatus === 'verified' && <ShieldCheck className="w-5 h-5 text-[#4ade80] shrink-0 mt-0.5" />}
              {event.signatureStatus === 'failed' && <ShieldAlert className="w-5 h-5 text-[#f87171] shrink-0 mt-0.5" />}
              {event.signatureStatus === 'missing_secret' && <Shield className="w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5" />}
              {event.signatureStatus === 'unsigned' && <Shield className="w-5 h-5 text-[#71717a] shrink-0 mt-0.5" />}

              <div>
                <h4 className="text-xs font-semibold text-white">
                  {event.signatureStatus === 'verified' && 'Signature Verified'}
                  {event.signatureStatus === 'failed' && 'Signature Verification Failed'}
                  {event.signatureStatus === 'missing_secret' && 'Signing Secret Missing'}
                  {event.signatureStatus === 'unsigned' && 'No Signature Header Detected'}
                </h4>
                <p className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed">
                  {event.signatureDetails?.message || 'Signature processed according to endpoint configuration.'}
                </p>
              </div>
            </div>

            {/* Cryptographic breakdown */}
            <div className="border border-[#222222] rounded-lg bg-[#0a0a0a] p-4 space-y-3 font-mono text-xs">
              <div className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">Cryptographic Diagnostics</div>
              
              <div className="space-y-2.5">
                <div>
                  <span className="text-[#71717a] block text-[11px]">Provider:</span>
                  <span className="text-white font-medium">{event.signatureDetails?.provider || endpoint?.signatureProvider || 'Auto'}</span>
                </div>

                {event.signatureDetails?.headerName && (
                  <div>
                    <span className="text-[#71717a] block text-[11px]">Header Name:</span>
                    <span className="text-white">{event.signatureDetails.headerName}</span>
                  </div>
                )}

                {event.signatureDetails?.receivedSignature && (
                  <div>
                    <span className="text-[#71717a] block text-[11px]">Received Header:</span>
                    <span className="text-white break-all select-all">{event.signatureDetails.receivedSignature}</span>
                  </div>
                )}

                {event.signatureDetails?.expectedSignature && (
                  <div>
                    <span className="text-[#71717a] block text-[11px]">Expected Computed Hash:</span>
                    <span className="text-[#4ade80] break-all select-all">{event.signatureDetails.expectedSignature}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#71717a] text-[11px]">Configured Secret:</span>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-[#71717a] hover:text-white flex items-center gap-1 font-sans"
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <span className="text-white font-mono">
                    {endpoint?.secret 
                      ? (showSecret ? endpoint.secret : '••••••••••••••••••••••••••••')
                      : 'None configured (Set secret in Endpoint settings)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
