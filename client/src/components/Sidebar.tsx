import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Pause, 
  Play, 
  Clock, 
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
      case 'POST': return 'bg-zinc-800 text-zinc-100 border-zinc-700';
      case 'GET': return 'bg-zinc-900 text-sky-400 border-zinc-800';
      case 'PUT': return 'bg-zinc-900 text-amber-400 border-zinc-800';
      case 'PATCH': return 'bg-zinc-900 text-purple-400 border-zinc-800';
      case 'DELETE': return 'bg-zinc-900 text-red-400 border-zinc-800';
      default: return 'bg-zinc-900 text-zinc-400 border-zinc-800';
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
    <aside className="w-80 md:w-88 border-r border-zinc-800 bg-zinc-950 flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Search & Filter bar */}
      <div className="p-3 border-b border-zinc-800 space-y-2 bg-zinc-950">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800/80 p-0.5 rounded-md">
            {(['all', 'verified', 'failed', 'forwarded'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                  filterType === tab
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
              isPaused
                ? 'bg-amber-950/30 text-amber-400 border-amber-800/40'
                : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-zinc-900'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'Paused' : 'Live'}</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 text-zinc-700 mb-2" />
            <p className="text-xs font-medium text-zinc-400">No requests captured</p>
            <p className="text-[11px] text-zinc-600 mt-1 max-w-[200px]">
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
                  isSelected ? 'bg-zinc-900 border-l-2 border-zinc-200' : 'hover:bg-zinc-900/40'
                }`}
              >
                {/* Method, Path, Time */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border uppercase ${getMethodBadge(event.method)}`}>
                      {event.method}
                    </span>
                    <span className="font-mono text-xs text-zinc-200 truncate font-medium">
                      {event.path}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>

                {/* Sub row: signature status, event type, size */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    {event.signatureStatus === 'verified' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>verified</span>
                      </span>
                    )}
                    {event.signatureStatus === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
                        <ShieldAlert className="w-3 h-3 text-red-400" />
                        <span>invalid sig</span>
                      </span>
                    )}
                    {event.signatureStatus === 'missing_secret' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span>no secret</span>
                      </span>
                    )}

                    {event.body?.type && (
                      <span className="text-zinc-400 truncate max-w-[130px]">
                        {event.body.type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                    {event.forwardResponse && (
                      <span className={`${
                        event.forwardResponse.statusCode >= 200 && event.forwardResponse.statusCode < 400
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}>
                        {event.forwardResponse.statusCode || 'ERR'} ({event.forwardResponse.timeMs}ms)
                      </span>
                    )}
                    <span className="text-zinc-600">
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
      <div className="p-2.5 border-t border-zinc-800 bg-zinc-950 text-[11px] text-zinc-500 flex items-center justify-between font-mono">
        <span>{filteredEvents.length} requests</span>
        <span className="text-zinc-400">stream active</span>
      </div>
    </aside>
  );
};
