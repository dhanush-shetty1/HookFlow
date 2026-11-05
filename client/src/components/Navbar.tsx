import React, { useState } from 'react';
import {
  Copy,
  Check,
  Plus,
  Settings2,
  Trash2,
  ChevronDown,
  Send,
  Lock,
  LogOut,
  User as UserIcon,
  FlaskConical,
  Webhook
} from 'lucide-react';
import { Endpoint, DashboardPlane, User } from '../types';
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
    <header className="h-[56px] border-b border-[#222222] bg-black/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 select-none font-mono">

      {/* Brand & Plane Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center hover:opacity-85 transition-opacity"
          title="Back to Home"
        >
          <span className="font-bold text-sm tracking-tight text-white">HookFlow</span>
        </button>

        <div className="h-4 w-px bg-[#222222]" />

        {/* Dual-Plane Selector (Clean & Minimalist) */}
        <div className="flex items-center bg-[#0a0a0a] p-0.5 rounded-md border border-[#222222]">
          <button
            onClick={() => onSelectPlane('sandbox')}
            title="Public Mock Sandbox (No login required)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              plane === 'sandbox'
                ? 'bg-[#141414] text-white border border-[#333333] shadow-sm'
                : 'text-[#71717a] hover:text-[#e4e4e7]'
            }`}
          >
            <FlaskConical className="w-3 h-3 text-white" />
            <span className="hidden md:inline">Mock Sandbox</span>
            <span className="md:hidden">Sandbox</span>
          </button>

          <button
            onClick={() => onSelectPlane('private')}
            title="Private Studio Vault (Isolated, JWT-authenticated)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              plane === 'private'
                ? 'bg-[#141414] text-white border border-[#333333] shadow-sm'
                : 'text-[#71717a] hover:text-[#e4e4e7]'
            }`}
          >
            <Lock className="w-3 h-3 text-white" />
            <span className="hidden md:inline">Private Studio</span>
            <span className="md:hidden">Private</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#222222] hidden lg:block" />

        {/* Endpoint Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-[#0a0a0a] hover:border-[#404040] border border-[#222222] px-3 py-1.5 rounded-md text-xs font-medium text-[#e4e4e7] transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-[#4ade80]' : 'bg-[#71717a]'}`} />
            <span className="max-w-[120px] md:max-w-[170px] truncate">
              {selectedEndpoint ? selectedEndpoint.name : (endpoints.length > 0 ? 'Select Endpoint' : 'No Endpoints')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#71717a] ml-0.5" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-1.5 w-72 bg-[#0a0a0a] border border-[#222222] rounded-lg shadow-2xl py-1 z-50 divide-y divide-[#222222]">
                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-medium text-[#71717a] uppercase tracking-widest">
                  <span>{plane === 'sandbox' ? 'Public Sandboxes' : 'Private Endpoints'}</span>
                  {plane === 'private' && (
                    <span className="text-white normal-case font-mono">vault scoped</span>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {endpoints.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-[#71717a]">
                      {plane === 'private'
                        ? 'No private endpoints yet. Click below to create one.'
                        : 'No sandbox templates available.'}
                    </div>
                  ) : (
                    endpoints.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => { onSelectEndpoint(ep); setDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#141414] transition-colors ${
                          selectedEndpoint?.id === ep.id ? 'bg-[#141414] text-white font-semibold border-l-2 border-l-white' : 'text-[#71717a]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-white truncate flex items-center gap-1.5">
                            {!ep.isPublic && <Lock className="w-2.5 h-2.5 text-white shrink-0" />}
                            <span>{ep.name}</span>
                          </div>
                          <div className="text-[10px] text-[#71717a] font-mono">/hook/{ep.id}</div>
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
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#a1a1aa] hover:text-white hover:bg-[#141414] rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>{plane === 'private' ? 'New Private Endpoint' : 'New Ingestion Endpoint'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* URL Bar */}
      <div className="hidden xl:flex items-center gap-2 bg-[#0a0a0a] border border-[#222222] rounded-md px-3 py-1.5 max-w-md w-full mx-4">
        <span className="text-[10px] text-white font-mono font-bold">INGEST</span>
        <input
          type="text"
          readOnly
          value={webhookUrl}
          className="bg-transparent font-mono text-xs text-white focus:outline-none flex-1 truncate select-all selection:bg-[#262626]"
        />
        <button
          onClick={handleCopyUrl}
          className="text-[#71717a] hover:text-white transition-colors flex items-center gap-1 shrink-0"
        >
          {copiedUrl ? (
            <><Check className="w-3 h-3 text-[#4ade80]" /><span className="text-[#4ade80] text-[10px]">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" /><span className="text-[10px]">Copy</span></>
          )}
        </button>
      </div>

      {/* Actions & User State */}
      <div className="flex items-center gap-2">
        {plane === 'sandbox' ? (
          <button
            onClick={onOpenMockModal}
            className="btn primary text-xs py-1.5 px-3.5 font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send Mock</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (!user) onOpenAuthModal();
              else onOpenNewEndpointModal();
            }}
            className="btn primary text-xs py-1.5 px-3.5 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Endpoint</span>
          </button>
        )}

        {/* User Account Button */}
        {user ? (
          <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[#222222] rounded-md pl-2 pr-1 py-1">
            <UserIcon className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white max-w-[90px] truncate">
              {user.name.split(' ')[0]}
            </span>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1 hover:bg-[#141414] rounded text-[#71717a] hover:text-[#f87171] transition-colors"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="btn text-xs py-1.5 px-3"
          >
            <Lock className="w-3 h-3 text-white" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}

        <button
          onClick={onClearEvents}
          title="Clear events"
          className="p-1.5 text-[#71717a] hover:text-white hover:border-[#444444] rounded-md border border-[#222222] bg-[#0a0a0a] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenSettingsModal}
          title="Settings & Persistence"
          className="p-1.5 text-[#71717a] hover:text-white hover:border-[#444444] rounded-md border border-[#222222] bg-[#0a0a0a] transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>

        {/* WS status */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#222222] text-[10px] font-mono">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-[#4ade80]' : 'bg-[#71717a]'}`} />
          <span className={isWsConnected ? 'text-white' : 'text-[#71717a]'}>
            {isWsConnected ? `${wsLatency}ms` : 'offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
