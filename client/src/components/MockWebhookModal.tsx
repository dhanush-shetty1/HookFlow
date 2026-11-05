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

const getProviderColor = (provider: string) => {
  switch ((provider || '').toLowerCase()) {
    case 'stripe': return { color: '#635bff', bg: 'rgba(99, 91, 255, 0.12)', border: 'rgba(99, 91, 255, 0.4)' };
    case 'github': return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.4)' };
    case 'shopify': return { color: '#95bf47', bg: 'rgba(149, 191, 71, 0.12)', border: 'rgba(149, 191, 71, 0.4)' };
    case 'clerk': return { color: '#6c47ff', bg: 'rgba(108, 71, 255, 0.12)', border: 'rgba(108, 71, 255, 0.4)' };
    case 'twilio': return { color: '#f22f46', bg: 'rgba(242, 47, 70, 0.12)', border: 'rgba(242, 47, 70, 0.4)' };
    case 'slack': return { color: '#ecb22e', bg: 'rgba(236, 178, 46, 0.12)', border: 'rgba(236, 178, 46, 0.4)' };
    case 'discord': return { color: '#5865f2', bg: 'rgba(88, 101, 242, 0.12)', border: 'rgba(88, 101, 242, 0.4)' };
    default: return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.4)' };
  }
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#222222] bg-black flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Send Mock Webhook</h3>
            <p className="text-xs text-[#71717a]">Dispatch pre-configured test requests with valid signatures</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#141414] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#0a0a0a]">
          {/* Target Endpoint Selection */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Target Endpoint
            </label>
            <select
              value={targetEndpointId}
              onChange={(e) => setTargetEndpointId(e.target.value)}
              className="w-full bg-black border border-[#222222] focus:border-white rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
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
            <label className="block text-xs font-medium text-[#a1a1aa] mb-2">
              Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((tpl) => {
                const prov = getProviderColor(tpl.provider);
                const isSelected = selectedTemplateId === tpl.id;

                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className="p-3 rounded-lg border text-left transition-all relative overflow-hidden"
                    style={{
                      backgroundColor: isSelected ? prov.bg : '#000000',
                      borderColor: isSelected ? prov.border : '#222222',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white">{tpl.name}</span>
                      <span
                        className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border"
                        style={{
                          color: prov.color,
                          borderColor: prov.border,
                          backgroundColor: '#0a0a0c',
                        }}
                      >
                        {tpl.provider}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#71717a] truncate">{tpl.event}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payload Preview */}
          {currentTemplate && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#a1a1aa]">Payload Preview</span>
                <span className="text-[11px] text-[#4ade80] font-mono">HMAC computed on dispatch</span>
              </div>
              <div className="bg-black border border-[#222222] rounded-lg p-3 font-mono text-xs text-white max-h-48 overflow-y-auto selection:bg-[#262626]">
                <pre className="whitespace-pre-wrap">{JSON.stringify(currentTemplate.body, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#222222] bg-black flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="btn text-xs py-1.5 px-3"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || sentSuccess}
            className="btn primary text-xs py-1.5 px-4 font-bold disabled:opacity-50"
          >
            {sentSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
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
