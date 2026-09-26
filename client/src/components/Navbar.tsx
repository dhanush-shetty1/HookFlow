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
  Lock,
  LogOut,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { Endpoint, DashboardPlane, User } from '../types';
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
  plane: DashboardPlane;
  onSelectPlane: (plane: DashboardPlane) => void;
  user: User | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
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
  plane,
  onSelectPlane,
  user,
  onOpenAuthModal,
  onLogout
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getWebhookHost = () => {
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost' && window.location.port === '3000';
      return isDev ? 'http://localhost:4000' : window.location.origin;
    }
    return 'http://localhost:4000';
  };

  const webhookUrl = selectedEndpoint
    ? `${getWebhookHost()}/hook/${selectedEndpoint.id}`
    : `${getWebhookHost()}/hook/ep_default`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <header className="h-14 border-b border-zinc-800/70 bg-black/80 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-30 select-none">

      {/* Brand & Plane Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
          title="Back to HookFlow"
        >
          <div className="w-7 h-7 rounded-md bg-zinc-50 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-zinc-950" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100 hidden sm:inline">HookFlow</span>
        </button>

        <div className="h-4 w-px bg-zinc-800" />

        {/* ── DUAL-PLANE ARCHITECTURE SELECTOR ──────────────────────── */}
        <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800/80">
          <button
            onClick={() => onSelectPlane('sandbox')}
            title="Public Mock Sandbox (No login required)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              plane === 'sandbox'
                ? 'bg-zinc-800 text-amber-300 shadow-sm ring-1 ring-amber-500/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>🎪</span>
            <span className="hidden md:inline">Mock Sandbox</span>
            <span className="md:hidden">Sandbox</span>
          </button>

          <button
            onClick={() => onSelectPlane('private')}
            title="Private Studio Vault (Isolated, JWT-authenticated)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              plane === 'private'
                ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/40 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Lock className="w-3 h-3 text-indigo-400" />
            <span className="hidden md:inline">Private Studio</span>
            <span className="md:hidden">Private</span>
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800 hidden lg:block" />

        {/* Endpoint Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-200 transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
            <span className="max-w-[120px] md:max-w-[170px] truncate">
              {selectedEndpoint ? selectedEndpoint.name : (endpoints.length > 0 ? 'Select Endpoint' : 'No Endpoints')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-1.5 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl py-1 z-50 divide-y divide-zinc-900">
                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                  <span>{plane === 'sandbox' ? 'Public Sandboxes' : 'Private Endpoints'}</span>
                  {plane === 'private' && (
                    <span className="text-indigo-400 normal-case font-mono">vault scoped</span>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {endpoints.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-zinc-600">
                      {plane === 'private'
                        ? 'No private endpoints yet. Click below to create one.'
                        : 'No sandbox templates available.'}
                    </div>
                  ) : (
                    endpoints.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => { onSelectEndpoint(ep); setDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-900 transition-colors ${
                          selectedEndpoint?.id === ep.id ? 'bg-zinc-900/80 text-zinc-100 font-medium' : 'text-zinc-400'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-zinc-200 truncate flex items-center gap-1.5">
                            {!ep.isPublic && <Lock className="w-2.5 h-2.5 text-indigo-400 shrink-0" />}
                            <span>{ep.name}</span>
                          </div>
                          <div className="text-[10px] text-zinc-600 font-mono">/hook/{ep.id}</div>
                        </div>
                        <Badge variant="outline">{ep.signatureProvider}</Badge>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      if (plane === 'private' && !user) {
                        onOpenAuthModal();
                      } else {
                        onOpenNewEndpointModal();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{plane === 'private' ? 'New Private Endpoint' : 'New Ingestion Endpoint'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* URL Bar */}
      <div className="hidden xl:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-1.5 max-w-md w-full mx-4">
        <span className="text-[10px] text-zinc-600 font-mono">INGEST</span>
        <input
          type="text"
          readOnly
          value={webhookUrl}
          className="bg-transparent font-mono text-xs text-zinc-300 focus:outline-none flex-1 truncate select-all"
        />
        <button
          onClick={handleCopyUrl}
          className="text-zinc-600 hover:text-zinc-200 transition-colors flex items-center gap-1 shrink-0"
        >
          {copiedUrl ? (
            <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 text-[10px]">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" /><span className="text-[10px]">Copy</span></>
          )}
        </button>
      </div>

      {/* Actions & User State */}
      <div className="flex items-center gap-2">
        {plane === 'sandbox' ? (
          <ShimmerButton variant="glass" size="sm" onClick={onOpenMockModal}>
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send Mock</span>
          </ShimmerButton>
        ) : (
          <button
            onClick={() => {
              if (!user) onOpenAuthModal();
              else onOpenNewEndpointModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Endpoint</span>
          </button>
        )}

        {/* User Account / Auth Button */}
        {user ? (
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg pl-2 pr-1 py-1">
            <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-zinc-200 max-w-[90px] truncate">
              {user.name.split(' ')[0]}
            </span>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
          >
            <Lock className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}

        <button
          onClick={onClearEvents}
          title="Clear events"
          className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenSettingsModal}
          title="Settings & Persistence"
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
