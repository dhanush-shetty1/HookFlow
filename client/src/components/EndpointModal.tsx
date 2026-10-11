import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Endpoint, SignatureProvider } from '../types';
import { api } from '../services/api';

interface EndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpointToEdit?: Endpoint | null;
  onSaved: (endpoint: Endpoint) => void;
}

export const EndpointModal: React.FC<EndpointModalProps> = ({
  isOpen,
  onClose,
  endpointToEdit,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [signatureProvider, setSignatureProvider] = useState<SignatureProvider>('auto');
  const [secret, setSecret] = useState('');
  const [forwardUrl, setForwardUrl] = useState('http://localhost:3000/api/webhooks');
  const [forwardEnabled, setForwardEnabled] = useState(false);
  const [customId, setCustomId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (endpointToEdit) {
      setName(endpointToEdit.name);
      setDescription(endpointToEdit.description || '');
      setSignatureProvider(endpointToEdit.signatureProvider || 'auto');
      setSecret(endpointToEdit.secret || '');
      setForwardUrl(endpointToEdit.forwardUrl || 'http://localhost:3000/api/webhooks');
      setForwardEnabled(endpointToEdit.forwardEnabled || false);
      setCustomId(endpointToEdit.id);
    } else {
      setName('');
      setDescription('');
      setSignatureProvider('auto');
      setSecret('');
      setForwardUrl('http://localhost:3000/api/webhooks');
      setForwardEnabled(false);
      setCustomId(`ep_${Math.random().toString(36).substring(2, 9)}`);
    }
  }, [endpointToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (endpointToEdit) {
        const updated = await api.updateEndpoint(endpointToEdit.id, {
          name,
          description,
          signatureProvider,
          secret,
          forwardUrl,
          forwardEnabled
        });
        onSaved(updated);
      } else {
        const created = await api.createEndpoint({
          id: customId || undefined,
          name,
          description,
          signatureProvider,
          secret,
          forwardUrl,
          forwardEnabled
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      alert(`Error saving endpoint: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#222222] bg-black flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              {endpointToEdit ? 'Edit Endpoint' : 'Create Ingestion Endpoint'}
            </h3>
            <p className="text-xs text-[#71717a]">Configure signature verification and local proxy targets</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#141414] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 bg-[#0a0a0a]">
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Endpoint Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Stripe Payments"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-[#222222] focus:border-white rounded-md px-3 py-1.5 text-xs text-white focus:outline-none placeholder-[#71717a]"
            />
          </div>

          {!endpointToEdit && (
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Endpoint Slug
              </label>
              <div className="flex items-center gap-1.5 bg-black border border-[#222222] rounded-md px-3 py-1.5">
                <span className="text-xs text-[#71717a] font-mono">/hook/</span>
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="bg-transparent font-mono text-xs text-white focus:outline-none flex-1"
                />
              </div>
            </div>
          )}

          {/* Signature Verification Scheme */}
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Signature Verification
            </label>
            <select
              value={signatureProvider}
              onChange={(e) => setSignatureProvider(e.target.value as SignatureProvider)}
              className="w-full bg-black border border-[#222222] focus:border-white rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
            >
              <option value="auto">Auto-Detect</option>
              <option value="stripe">Stripe (stripe-signature)</option>
              <option value="github">GitHub (x-hub-signature-256)</option>
              <option value="shopify">Shopify (x-shopify-hmac-sha256)</option>
              <option value="clerk">Clerk / Svix (svix-signature)</option>
              <option value="custom_hmac_sha256">Custom HMAC-SHA256</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Signing Secret */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#a1a1aa]">
                Signing Secret (Optional)
              </label>
              <span className="text-[10px] text-[#71717a]">e.g. whsec_...</span>
            </div>
            <input
              type="text"
              placeholder="Paste signing secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-black border border-[#222222] focus:border-white rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none placeholder-[#71717a]"
            />
          </div>

          {/* Forwarding */}
          <div className="pt-2 border-t border-[#222222]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#a1a1aa]">
                Auto-Forward to Local Server
              </label>
              <input
                type="checkbox"
                checked={forwardEnabled}
                onChange={(e) => setForwardEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-[#222222] bg-black accent-white"
              />
            </div>

            <input
              type="text"
              placeholder="http://localhost:3000/api/webhooks"
              value={forwardUrl}
              onChange={(e) => setForwardUrl(e.target.value)}
              className="w-full bg-black border border-[#222222] focus:border-white rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="btn primary text-xs py-1.5 px-4 font-bold"
            >
              {isSaving ? 'Saving...' : endpointToEdit ? 'Save Changes' : 'Create Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
