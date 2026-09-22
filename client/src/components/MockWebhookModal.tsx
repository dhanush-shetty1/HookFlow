import React, { useState, useEffect } from 'react';
import { X, Send, Check } from 'lucide-react';
import { Endpoint, MockWebhookTemplate } from '../types';
import { api } from '../services/api';

interface MockWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoints: Endpoint[];
  selectedEndpoint: Endpoint | null;
  onMockSent: () => void;
}

export const MockWebhookModal: React.FC<MockWebhookModalProps> = ({
  isOpen,
  onClose,
  endpoints,
  selectedEndpoint,
  onMockSent
}) => {
  const [templates, setTemplates] = useState<MockWebhookTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [targetEndpointId, setTargetEndpointId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getMockTemplates().then((tpls) => {
        setTemplates(tpls);
        if (tpls.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(tpls[0].id);
        }
      });
      if (selectedEndpoint) {
        setTargetEndpointId(selectedEndpoint.id);
      } else if (endpoints.length > 0) {
        setTargetEndpointId(endpoints[0].id);
      }
    }
  }, [isOpen, selectedEndpoint, endpoints]);

  if (!isOpen) return null;

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleSend = async () => {
    if (!targetEndpointId || !currentTemplate) return;
    setIsSending(true);
    try {
      await api.sendMockWebhook(targetEndpointId, currentTemplate.id);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onMockSent();
        onClose();
      }, 500);
    } catch (err: any) {
      alert(`Failed to send mock webhook: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Send Mock Webhook</h3>
            <p className="text-xs text-zinc-500">Dispatch pre-configured test requests with valid signatures</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Target Endpoint Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Target Endpoint
            </label>
            <select
              value={targetEndpointId}
              onChange={(e) => setTargetEndpointId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
            >
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.name} (/hook/{ep.id}) - [{ep.signatureProvider.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {/* Template Picker */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    selectedTemplateId === tpl.id
                      ? 'bg-zinc-900 border-zinc-500 text-zinc-100 shadow-sm'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs text-zinc-200">{tpl.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      {tpl.provider}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 truncate">{tpl.event}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payload Preview */}
          {currentTemplate && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">Payload Preview</span>
                <span className="text-[11px] text-zinc-500 font-mono">HMAC computed on send</span>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-md p-3 font-mono text-xs text-zinc-300 max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{JSON.stringify(currentTemplate.body, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || sentSuccess}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors disabled:opacity-50"
          >
            {sentSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sent</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Dispatch Request'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
