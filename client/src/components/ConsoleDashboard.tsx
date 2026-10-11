import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { EventDetail } from './EventDetail';
import { MockWebhookModal } from './MockWebhookModal';
import { EndpointModal } from './EndpointModal';
import { SettingsModal } from './SettingsModal';
import { AuthModal } from './AuthModal';
import { Endpoint, WebhookEvent, DashboardPlane, User } from '../types';
import { api } from '../services/api';
import { playWebhookChime } from '../utils/audio';

export const ConsoleDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Dual-Plane Architecture State
  const [plane, setPlane] = useState<DashboardPlane>('sandbox');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMongoConnected, setIsMongoConnected] = useState(false);

  // Load endpoints & events for a given plane
  const loadPlaneData = async (targetPlane: DashboardPlane) => {
    try {
      const [eps, health] = await Promise.all([
        api.getEndpoints(targetPlane),
        api.getHealth().catch(() => ({ mongoConnected: false }))
      ]);

      setEndpoints(eps);
      setIsMongoConnected(health.mongoConnected);

      const firstEp = eps.length > 0 ? eps[0] : null;
      setSelectedEndpoint(firstEp);

      if (firstEp) {
        const evts = await api.getEvents(firstEp.id, targetPlane);
        setEvents(evts);
        setSelectedEvent(evts.length > 0 ? evts[0] : null);
      } else {
        setEvents([]);
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error('Failed to load HookFlow plane data:', err);
    }
  };

  // Initial Boot: check existing user session and load initial plane
  useEffect(() => {
    const initSession = async () => {
      const user = await api.getMe();
      if (user) {
        setCurrentUser(user);
        // Default to private studio if already logged in
        setPlane('private');
        await loadPlaneData('private');
      } else {
        // Default to frictionless sandbox
        setPlane('sandbox');
        await loadPlaneData('sandbox');
      }
    };
    initSession();
  }, []);

  // WebSocket Setup & Room Management
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

        // Authenticate socket if token exists
        const token = api.getToken();
        if (token) {
          ws.send(JSON.stringify({ type: 'AUTH', token }));
        }

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

            // Plane filter check:
            // In Sandbox plane, only show public events.
            // In Private Studio, only show private events.
            if (plane === 'sandbox' && !newEvt.isPublic) return;
            if (plane === 'private' && newEvt.isPublic) return;

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
            api.getEndpoints(plane).then(setEndpoints);
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
  }, [plane, isPaused]);

  // Plane switching handler
  const handleSelectPlane = async (newPlane: DashboardPlane) => {
    if (newPlane === 'private' && !currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setPlane(newPlane);
    await loadPlaneData(newPlane);
  };

  // Auth success handler
  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const token = api.getToken();
      if (token) {
        wsRef.current.send(JSON.stringify({ type: 'AUTH', token }));
      }
    }
    setPlane('private');
    await loadPlaneData('private');
  };

  // Logout handler
  const handleLogout = async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LOGOUT' }));
    }
    api.logout();
    setCurrentUser(null);
    setPlane('sandbox');
    await loadPlaneData('sandbox');
  };

  // When selected endpoint changes, reload events
  const handleSelectEndpoint = async (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    try {
      const evts = await api.getEvents(ep.id, plane);
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
    <div className="min-h-screen bg-black text-[#e4e4e7] flex flex-col font-mono relative overflow-hidden selection:bg-[#262626] selection:text-white">
      {/* Background aesthetics */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-dot-odysseus opacity-40" />
      </div>

      {/* Content layers above background */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        {/* Top Navbar with Dual-Plane Controls */}
        <Navbar
          endpoints={endpoints}
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={handleSelectEndpoint}
          onOpenNewEndpointModal={() => {
            if (plane === 'private' && !currentUser) {
              setIsAuthModalOpen(true);
              return;
            }
            setEndpointToEdit(null);
            setIsEndpointModalOpen(true);
          }}
          onOpenMockModal={() => setIsMockModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onClearEvents={handleClearEvents}
          onNavigateHome={() => navigate('/')}
          isWsConnected={isWsConnected}
          wsLatency={wsLatency}
          plane={plane}
          onSelectPlane={handleSelectPlane}
          user={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <MockWebhookModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        endpoints={endpoints}
        selectedEndpoint={selectedEndpoint}
        onMockSent={() => loadPlaneData(plane)}
      />

      <EndpointModal
        isOpen={isEndpointModalOpen}
        onClose={() => {
          setIsEndpointModalOpen(false);
          setEndpointToEdit(null);
        }}
        endpointToEdit={endpointToEdit}
        onSaved={(saved) => {
          api.getEndpoints(plane).then((eps) => {
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
