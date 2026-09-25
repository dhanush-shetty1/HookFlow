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
  Wand2
} from 'lucide-react';
import { WebhookEvent, Endpoint, SchemaSynthesisResult, ForwardResponse } from '../types';
import { api } from '../services/api';

interface EventDetailProps {
  event: WebhookEvent | null;
  endpoint: Endpoint | null;
  onEventUpdated?: (updated: WebhookEvent) => void;
}

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
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 h-[calc(100vh-3.5rem)] bg-zinc-950">
        <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-400">
          <Terminal className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-zinc-300">No Request Selected</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center">
          Select a request from the sidebar to inspect payload, headers, signature verification, and synthesize schemas.
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

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-zinc-950 overflow-hidden">
      {/* Event Header Banner */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-100 uppercase">
            {event.method}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-zinc-100">{event.path}</span>
              <span className="text-[11px] text-zinc-500 font-mono">({event.id})</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono mt-0.5">
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
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          )}
          {event.signatureStatus === 'failed' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-red-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Invalid Signature</span>
            </div>
          )}
          {event.signatureStatus === 'missing_secret' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>No Secret</span>
            </div>
          )}

          {event.forwardResponse && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-medium border bg-zinc-900 ${
              event.forwardResponse.statusCode >= 200 && event.forwardResponse.statusCode < 400
                ? 'text-emerald-400 border-zinc-800'
                : 'text-red-400 border-zinc-800'
            }`}>
              <span>Forward: {event.forwardResponse.statusCode || 'ERR'}</span>
              <span className="text-[10px] text-zinc-500">({event.forwardResponse.timeMs}ms)</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab('replayer')}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium px-3 py-1.5 rounded-md text-xs transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Replay</span>
          </button>

          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors"
            title="Copy cURL"
          >
            {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Terminal className="w-3 h-3" />}
            <span className="hidden md:inline">{copiedCurl ? 'Copied' : 'cURL'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Shadcn Tabs style) */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 flex items-center gap-1 select-none">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md text-xs">
          <button
            onClick={() => setActiveTab('payload')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'payload'
                ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Payload</span>
          </button>

          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'headers'
                ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Headers ({Object.keys(event.headers).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'schema'
                ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Schema Synthesizer</span>
          </button>

          <button
            onClick={() => setActiveTab('replayer')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'replayer'
                ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Replayer</span>
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'signature'
                ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Signature</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 bg-zinc-950">
        {/* Tab: Payload */}
        {activeTab === 'payload' && (
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-zinc-400">
                Inbound Payload ({typeof event.body === 'object' && event.body ? `${Object.keys(event.body).length} root keys` : 'raw'})
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRawPayload(!isRawPayload)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  {isRawPayload ? 'Formatted' : 'Raw'}
                </button>
                <button
                  onClick={() => handleCopyCode(typeof event.body === 'object' ? JSON.stringify(event.body, null, 2) : event.rawBody)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-auto text-zinc-200">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {isRawPayload 
                  ? event.rawBody 
                  : (typeof event.body === 'object' ? JSON.stringify(event.body, null, 2) : event.rawBody || '{}')}
              </pre>
            </div>
          </div>
        )}

        {/* Tab: Headers & Query */}
        {activeTab === 'headers' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-zinc-400">
                  HTTP Request Headers ({Object.keys(event.headers).length})
                </div>
                <button
                  onClick={() => handleCopyCode(JSON.stringify(event.headers, null, 2))}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Copy JSON
                </button>
              </div>
              <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30 font-mono text-xs divide-y divide-zinc-800/60">
                {Object.entries(event.headers).map(([key, val]) => (
                  <div key={key} className="flex items-start p-2.5 hover:bg-zinc-900/60 transition-colors">
                    <div className="w-1/3 min-w-[180px] font-medium text-zinc-400 select-all pr-2">{key}</div>
                    <div className="flex-1 text-zinc-200 break-all select-all">
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {event.query && Object.keys(event.query).length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-400 mb-2">
                  URL Query Parameters ({Object.keys(event.query).length})
                </div>
                <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30 font-mono text-xs divide-y divide-zinc-800/60">
                  {Object.entries(event.query).map(([key, val]) => (
                    <div key={key} className="flex items-start p-2.5 hover:bg-zinc-900/60">
                      <div className="w-1/3 min-w-[180px] font-medium text-zinc-400 select-all">{key}</div>
                      <div className="flex-1 text-zinc-200 break-all select-all">{String(val)}</div>
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
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-zinc-200">
                      {synthesisResult.insights.title || 'Synthesized Schema'}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {synthesisResult.insights.detectedProvider}
                    </span>
                    {synthesisResult.insights.hasPII && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/50 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        PII: {synthesisResult.insights.piiFields.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {synthesisResult.insights.summary}
                  </p>
                </div>
                <button
                  onClick={() => handleAutoSynthesize(event.body, true)}
                  disabled={isSynthesizing}
                  className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize with Gemini'}</span>
                </button>
              </div>
            )}

            {/* Language Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md text-xs">
                {(['typescript', 'zod', 'python', 'go', 'nextjs', 'express'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSchemaLanguage(lang)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      schemaLanguage === lang
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {lang === 'nextjs' ? 'Next.js' : lang === 'express' ? 'Express' : lang}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopyCode(currentSchemaCode())}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Box */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-auto text-zinc-200 max-h-[500px]">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {currentSchemaCode()}
              </pre>
            </div>
          </div>
        )}

        {/* Tab: Replayer & Forwarder Studio */}
        {activeTab === 'replayer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Method</label>
                <select
                  value={replayMethod}
                  onChange={(e) => setReplayMethod(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
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
                  <label className="text-xs font-medium text-zinc-400">Destination URL</label>
                  {(replayUrl.includes('localhost') || replayUrl.includes('127.0.0.1')) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      <Zap className="w-2.5 h-2.5" /> LocalBridge™ (Zero-Tunnel Direct)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replayUrl}
                    onChange={(e) => setReplayUrl(e.target.value)}
                    placeholder="http://localhost:3000/api/webhooks"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                  <button
                    onClick={handleReplay}
                    disabled={isReplaying || !replayUrl}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-900 font-medium rounded-md text-xs transition-colors shrink-0"
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
                <label className="block text-xs font-medium text-zinc-400 mb-1">Request Headers (JSON)</label>
                <textarea
                  rows={8}
                  value={replayHeaders}
                  onChange={(e) => setReplayHeaders(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Request Body (JSON / Raw)</label>
                <textarea
                  rows={8}
                  value={replayBody}
                  onChange={(e) => setReplayBody(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
                />
              </div>
            </div>

            {/* Response Viewer */}
            {replayResult && (
              <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
                <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-zinc-400">Response:</span>
                    <span className={`font-semibold ${
                      replayResult.statusCode >= 200 && replayResult.statusCode < 400
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}>
                      {replayResult.statusCode} {replayResult.statusText}
                    </span>
                    <span className="text-zinc-500">({replayResult.timeMs}ms)</span>
                  </div>

                  {replayResult.error && (
                    <span className="text-xs text-red-400 font-mono">{replayResult.error}</span>
                  )}
                </div>

                <div className="p-4 font-mono text-xs text-zinc-300 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-all">
                    {typeof replayResult.body === 'object' && replayResult.body !== null
                      ? JSON.stringify(replayResult.body, null, 2)
                      : String(replayResult.body || (replayResult.error ? 'No response payload' : 'Empty body'))}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Signature Verifier */}
        {activeTab === 'signature' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-start gap-3">
              {event.signatureStatus === 'verified' && <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {event.signatureStatus === 'failed' && <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              {event.signatureStatus === 'missing_secret' && <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              {event.signatureStatus === 'unsigned' && <Shield className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />}

              <div>
                <h4 className="text-xs font-semibold text-zinc-200">
                  {event.signatureStatus === 'verified' && 'Signature Verified'}
                  {event.signatureStatus === 'failed' && 'Signature Verification Failed'}
                  {event.signatureStatus === 'missing_secret' && 'Signing Secret Missing'}
                  {event.signatureStatus === 'unsigned' && 'No Signature Header Detected'}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  {event.signatureDetails?.message || 'Signature processed according to endpoint configuration.'}
                </p>
              </div>
            </div>

            {/* Cryptographic breakdown */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4 space-y-3 font-mono text-xs">
              <div className="text-xs font-semibold text-zinc-400 uppercase">Cryptographic Diagnostics</div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Provider:</span>
                  <span className="text-zinc-200 font-medium">{event.signatureDetails?.provider || endpoint?.signatureProvider || 'Auto'}</span>
                </div>

                {event.signatureDetails?.headerName && (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Header Name:</span>
                    <span className="text-zinc-300">{event.signatureDetails.headerName}</span>
                  </div>
                )}

                {event.signatureDetails?.receivedSignature && (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Received Header:</span>
                    <span className="text-zinc-300 break-all select-all">{event.signatureDetails.receivedSignature}</span>
                  </div>
                )}

                {event.signatureDetails?.expectedSignature && (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Expected Computed Hash:</span>
                    <span className="text-emerald-400 break-all select-all">{event.signatureDetails.expectedSignature}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px]">Configured Secret:</span>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-sans"
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <span className="text-zinc-300 font-mono">
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
