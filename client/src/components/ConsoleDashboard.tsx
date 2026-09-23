import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { EventDetail } from './EventDetail';
import { MockWebhookModal } from './MockWebhookModal';
import { EndpointModal } from './EndpointModal';
import { SettingsModal } from './SettingsModal';
import { Endpoint, WebhookEvent } from '../types';
import { api } from '../services/api';
import { playWebhookChime } from '../utils/audio';

export const ConsoleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  // WebSocket state
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [wsLatency, setWsLatency] = useState(8);
  const [isPaused, setIsPaused] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);

  // Modal states
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [endpointToEdit, setEndpointToEdit] = useState<Endpoint | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMongoConnected, setIsMongoConnected] = useState(false);

  // Initial Data Fetch - Parallelized for instant loading
  const loadData = async () => {
    try {
      const [eps, health] = await Promise.all([
        api.getEndpoints(),
        api.getHealth().catch(() => ({ mongoConnected: false }))
      ]);
      setEndpoints(eps);
      setIsMongoConnected(health.mongoConnected);

      const firstEp = eps.length > 0 ? eps[0] : null;
      if (firstEp && !selectedEndpoint) {
        setSelectedEndpoint(firstEp);
      }

      const evts = await api.getEvents(firstEp?.id);
      setEvents(evts);
      if (evts.length > 0 && !selectedEvent) {
        setSelectedEvent(evts[0]);
      }
    } catch (err) {
      console.error('Failed to load initial HookFlow data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // WebSocket Setup
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const getWsUrl = () => {
      if (typeof window !== 'undefined') {
        const isDev = window.location.hostname === 'localhost' && window.location.port === '3000';
        if (isDev) return 'ws://localhost:4000';
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}`;
      }
      return 'ws://localhost:4000';
    };

    const connectWs = () => {
      ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setIsWsConnected(true);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const start = performance.now();
            ws.send(JSON.stringify({ type: 'PING' }));
            (ws as any).lastPingTime = start;
          }
        }, 5000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'PONG') {
            const lastPing = (ws as any).lastPingTime || performance.now();
            const latency = Math.max(1, Math.round(performance.now() - lastPing));
            setWsLatency(latency);
          } else if (message.type === 'NEW_EVENT') {
            const newEvt: WebhookEvent = message.data;

            const soundEnabled = localStorage.getItem('hookflow_sound_enabled');
            if (soundEnabled !== 'false') {
              playWebhookChime();
            }

            setEvents((prev) => {
              if (isPaused) return prev;
              return [newEvt, ...prev.filter((e) => e.id !== newEvt.id)];
            });

            setSelectedEvent((prev) => {
              if (!prev || prev.endpointId === newEvt.endpointId) {
                return newEvt;
              }
              return prev;
            });
          } else if (message.type === 'EVENT_FORWARDED') {
            const { eventId, forwardStatus, forwardResponse } = message.data;
            setEvents((prev) =>
              prev.map((e) =>
                e.id === eventId ? { ...e, forwardStatus, forwardResponse } : e
              )
            );
            setSelectedEvent((prev) =>
              prev && prev.id === eventId
                ? { ...prev, forwardStatus, forwardResponse }
                : prev
            );
          } else if (message.type === 'ENDPOINT_CREATED' || message.type === 'ENDPOINT_UPDATED') {
            api.getEndpoints().then(setEndpoints);
          } else if (message.type === 'EVENTS_CLEARED') {
            setEvents([]);
            setSelectedEvent(null);
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsWsConnected(false);
        clearInterval(pingIntervalRef.current);
        reconnectTimeout = setTimeout(connectWs, 2500);
      };

      ws.onerror = () => {
        setIsWsConnected(false);
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
      clearInterval(pingIntervalRef.current);
    };
  }, [isPaused]);

  // When selected endpoint changes, reload events
  const handleSelectEndpoint = async (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    try {
      const evts = await api.getEvents(ep.id);
      setEvents(evts);
      if (evts.length > 0) {
        setSelectedEvent(evts[0]);
      } else {
        setSelectedEvent(null);
      }
    } catch {
      // ignore
    }
  };

  const handleClearEvents = async () => {
    if (confirm('Clear all captured events for this stream?')) {
      await api.clearEvents(selectedEndpoint?.id);
      setEvents([]);
      setSelectedEvent(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col font-sans relative overflow-hidden">
      {/* Shared background aesthetics matching landing page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-white opacity-20 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_40%,transparent_100%)]" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-500/3 blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-emerald-500/3 blur-3xl animate-float-slow" style={{ animationDelay: '-4s' }} />
      </div>
      {/* Content layers above background */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        {/* Top Navbar */}
        <Navbar
          endpoints={endpoints}
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={handleSelectEndpoint}
          onOpenNewEndpointModal={() => {
            setEndpointToEdit(null);
            setIsEndpointModalOpen(true);
          }}
          onOpenMockModal={() => setIsMockModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onClearEvents={handleClearEvents}
          onNavigateHome={() => navigate('/')}
          isWsConnected={isWsConnected}
          wsLatency={wsLatency}
        />

        {/* Main Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Event Stream Sidebar */}
          <Sidebar
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
            selectedEndpoint={selectedEndpoint}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
          />

          {/* Right Event Inspector & Synthesizer Pane */}
          <EventDetail
            event={selectedEvent}
            endpoint={selectedEndpoint}
            onEventUpdated={(updated) => {
              setSelectedEvent(updated);
              setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <MockWebhookModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        endpoints={endpoints}
        selectedEndpoint={selectedEndpoint}
        onMockSent={loadData}
      />

      <EndpointModal
        isOpen={isEndpointModalOpen}
        onClose={() => {
          setIsEndpointModalOpen(false);
          setEndpointToEdit(null);
        }}
        endpointToEdit={endpointToEdit}
        onSaved={(saved) => {
          api.getEndpoints().then((eps) => {
            setEndpoints(eps);
            setSelectedEndpoint(saved);
          });
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isMongoConnected={isMongoConnected}
      />
    </div>
  );
};
