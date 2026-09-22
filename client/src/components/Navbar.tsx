import React, { useState } from 'react';
import {
  Copy,
  Check,
  Plus,
  Settings2,
  Trash2,
  ChevronDown,
  Send,
  Radio,
} from 'lucide-react';
import { Endpoint } from '../types';
import { ShimmerButton } from './ui/ShimmerButton';
import { Badge } from './ui/Badge';

interface NavbarProps {
  endpoints: Endpoint[];
  selectedEndpoint: Endpoint | null;
  onSelectEndpoint: (ep: Endpoint) => void;
  onOpenNewEndpointModal: () => void;
  onOpenMockModal: () => void;
  onOpenSettingsModal: () => void;
  onClearEvents: () => void;
  onNavigateHome?: () => void;
  isWsConnected: boolean;
  wsLatency: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  endpoints,
  selectedEndpoint,
  onSelectEndpoint,
  onOpenNewEndpointModal,
  onOpenMockModal,
  onOpenSettingsModal,
  onClearEvents,
  onNavigateHome,
  isWsConnected,
  wsLatency,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const webhookUrl = selectedEndpoint
    ? `http://localhost:4000/hook/${selectedEndpoint.id}`
    : 'http://localhost:4000/hook/ep_default';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <header className="h-14 border-b border-zinc-800/70 bg-black/80 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-30 select-none">

      {/* Brand — clicking logo goes home */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
          title="Back to HookFlow"
        >
          <div className="w-7 h-7 rounded-md bg-zinc-50 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-zinc-950" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100">HookFlow</span>
          <Badge variant="outline" className="hidden sm:inline-flex">console</Badge>
        </button>

        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

        {/* Endpoint Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-200 transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
            <span className="max-w-[140px] md:max-w-[180px] truncate">
              {selectedEndpoint ? selectedEndpoint.name : 'Select Endpoint'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-1.5 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl py-1 z-50 divide-y divide-zinc-900">
                <div className="px-3 py-1.5 text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                  Active Inboxes
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {endpoints.map(ep => (
                    <button
                      key={ep.id}
                      onClick={() => { onSelectEndpoint(ep); setDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-900 transition-colors ${
                        selectedEndpoint?.id === ep.id ? 'bg-zinc-900/80 text-zinc-100 font-medium' : 'text-zinc-400'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-zinc-200 truncate">{ep.name}</div>
                        <div className="text-[10px] text-zinc-600 font-mono">/hook/{ep.id}</div>
                      </div>
                      <Badge variant="outline">{ep.signatureProvider}</Badge>
                    </button>
                  ))}
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setDropdownOpen(false); onOpenNewEndpointModal(); }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Ingestion Endpoint</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* URL Bar */}
      <div className="hidden lg:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-1.5 max-w-md w-full mx-4">
        <span className="text-[10px] text-zinc-600 font-mono">URL</span>
        <input
          type="text"
          readOnly
          value={webhookUrl}
          className="bg-transparent font-mono text-xs text-zinc-300 focus:outline-none flex-1 truncate select-all"
        />
        <button
          onClick={handleCopyUrl}
          className="text-zinc-600 hover:text-zinc-200 transition-colors flex items-center gap-1"
        >
          {copiedUrl ? (
            <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 text-[10px]">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" /><span className="text-[10px]">Copy</span></>
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <ShimmerButton variant="glass" size="sm" onClick={onOpenMockModal}>
          <Send className="w-3.5 h-3.5" />
          <span>Send Mock</span>
        </ShimmerButton>

        <button
          onClick={onClearEvents}
          title="Clear events"
          className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenSettingsModal}
          title="Settings"
          className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>

        {/* WS status */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-zinc-800 text-[10px] font-mono">
          <div className="relative flex">
            <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
            {isWsConnected && (
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
            )}
          </div>
          <span className={isWsConnected ? 'text-zinc-400' : 'text-zinc-600'}>
            {isWsConnected ? `${wsLatency}ms` : 'offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
