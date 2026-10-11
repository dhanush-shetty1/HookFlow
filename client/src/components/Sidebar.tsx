import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Pause, 
  Play, 
  RefreshCw
} from 'lucide-react';
import { WebhookEvent, Endpoint } from '../types';

interface SidebarProps {
  events: WebhookEvent[];
  selectedEvent: WebhookEvent | null;
  onSelectEvent: (event: WebhookEvent) => void;
  selectedEndpoint: Endpoint | null;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  selectedEndpoint,
  isPaused,
  onTogglePause
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'failed' | 'forwarded'>('all');

  const filteredEvents = events.filter((ev) => {
    if (selectedEndpoint && ev.endpointId !== selectedEndpoint.id) {
      return false;
    }

    if (filterType === 'verified' && ev.signatureStatus !== 'verified') return false;
    if (filterType === 'failed' && ev.signatureStatus !== 'failed') return false;
    if (filterType === 'forwarded' && (!ev.forwardResponse || ev.forwardResponse.statusCode === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesPath = ev.path.toLowerCase().includes(q);
      const matchesMethod = ev.method.toLowerCase().includes(q);
      const matchesId = ev.id.toLowerCase().includes(q);
      const matchesBody = typeof ev.body === 'object' ? JSON.stringify(ev.body).toLowerCase().includes(q) : String(ev.rawBody).toLowerCase().includes(q);
      return matchesPath || matchesMethod || matchesId || matchesBody;
    }

    return true;
  });

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case 'POST': return 'bg-[#0a0a0a] text-white border-[#222222]';
      case 'GET': return 'bg-[#0a0a0a] text-[#4ade80] border-[#222222]';
      case 'PUT': return 'bg-[#0a0a0a] text-white border-[#222222]';
      case 'PATCH': return 'bg-[#0a0a0a] text-white border-[#222222]';
      case 'DELETE': return 'bg-[#0a0a0a] text-[#f87171] border-[#222222]';
      default: return 'bg-[#0a0a0a] text-[#71717a] border-[#222222]';
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <aside className="w-80 md:w-88 border-r border-[#222222] bg-black flex flex-col h-[calc(100vh-56px)] select-none font-mono">
      {/* Search & Filter bar */}
      <div className="p-3 border-b border-[#222222] space-y-2 bg-black">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
          <input
            type="text"
            placeholder="Filter requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-white rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none transition-colors selection:bg-[#262626]"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-[#222222] p-0.5 rounded-md">
            {(['all', 'verified', 'failed', 'forwarded'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors ${
                  filterType === tab
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
              isPaused
                ? 'bg-[#0a0a0a] text-[#fbbf24] border-[#222222]'
                : 'bg-[#0a0a0a] text-[#4ade80] border-[#222222] hover:bg-[#141414]'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 text-[#fbbf24]" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'Paused' : 'Live'}</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222222]">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-[#71717a] flex flex-col items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 text-[#222222] mb-2" />
            <p className="text-xs font-semibold text-white">No requests captured</p>
            <p className="text-[11px] text-[#71717a] mt-1 max-w-[200px]">
              Waiting for incoming requests or mock dispatches.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isSelected = selectedEvent?.id === event.id;
            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#141414] border-l-2 border-l-white'
                    : 'hover:bg-[#0a0a0a]'
                }`}
              >
                {/* Method, Path, Time */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${getMethodBadge(event.method)}`}>
                      {event.method}
                    </span>
                    <span className="font-mono text-xs text-white truncate font-medium">
                      {event.path}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#71717a] font-mono shrink-0">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>

                {/* Sub row: signature status, event type, size */}
                <div className="flex items-center justify-between text-[11px] text-[#71717a] font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    {event.signatureStatus === 'verified' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#4ade80]">
                        <ShieldCheck className="w-3 h-3 text-[#4ade80]" />
                        <span>verified</span>
                      </span>
                    )}
                    {event.signatureStatus === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#f87171]">
                        <ShieldAlert className="w-3 h-3 text-[#f87171]" />
                        <span>invalid sig</span>
                      </span>
                    )}
                    {event.signatureStatus === 'missing_secret' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#fbbf24]">
                        <Shield className="w-3 h-3 text-[#fbbf24]" />
                        <span>no secret</span>
                      </span>
                    )}

                    {event.body?.type && (
                      <span className="text-[#a1a1aa] truncate max-w-[130px]">
                        {event.body.type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                    {event.forwardResponse && (
                      <span className={`${
                        event.forwardResponse.statusCode >= 200 && event.forwardResponse.statusCode < 400
                          ? 'text-[#4ade80]'
                          : 'text-[#f87171]'
                      }`}>
                        {event.forwardResponse.statusCode || 'ERR'} ({event.forwardResponse.timeMs}ms)
                      </span>
                    )}
                    <span className="text-[#71717a]">
                      {event.sizeBytes > 1024 ? `${(event.sizeBytes / 1024).toFixed(1)}k` : `${event.sizeBytes}b`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-[#222222] bg-black text-[11px] text-[#71717a] flex items-center justify-between font-mono">
        <span>{filteredEvents.length} requests</span>
        <span className="text-[#4ade80] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
          stream active
        </span>
      </div>
    </aside>
  );
};
