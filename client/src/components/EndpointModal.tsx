import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              {endpointToEdit ? 'Edit Endpoint' : 'Create Ingestion Endpoint'}
            </h3>
            <p className="text-xs text-zinc-500">Configure signature verification and local proxy targets</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Endpoint Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Stripe Payments"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
            />
          </div>

          {!endpointToEdit && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Endpoint Slug
              </label>
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5">
                <span className="text-xs text-zinc-500 font-mono">/hook/</span>
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="bg-transparent font-mono text-xs text-zinc-200 focus:outline-none flex-1"
                />
              </div>
            </div>
          )}

          {/* Signature Verification Scheme */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Signature Verification
            </label>
            <select
              value={signatureProvider}
              onChange={(e) => setSignatureProvider(e.target.value as SignatureProvider)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
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
              <label className="text-xs font-medium text-zinc-400">
                Signing Secret (Optional)
              </label>
              <span className="text-[10px] text-zinc-500">e.g. whsec_...</span>
            </div>
            <input
              type="text"
              placeholder="Paste signing secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none placeholder-zinc-600"
            />
          </div>

          {/* Forwarding */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400">
                Auto-Forward to Local Server
              </label>
              <input
                type="checkbox"
                checked={forwardEnabled}
                onChange={(e) => setForwardEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-zinc-100 accent-zinc-100"
              />
            </div>

            <input
              type="text"
              placeholder="http://localhost:3000/api/webhooks"
              value={forwardUrl}
              onChange={(e) => setForwardUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-900 font-medium rounded-md text-xs transition-colors"
            >
              {isSaving ? 'Saving...' : endpointToEdit ? 'Save Changes' : 'Create Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
