import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { sessionStore, PipelineStage, PipelineSession } from './sessionStore.js';

export interface TelemetryEvent {
  type:
    | 'PIPELINE_EVENT'
    | 'SESSION_UPDATED'
    | 'HEARTBEAT'
    | 'CONNECT_ACK'
    | 'STATE_REPLAY'
    | 'FALLBACK_MODE_CHANGED'
    | string;
  sessionId?: string;
  stage?: PipelineStage;
  timestamp: number;
  elapsedMs?: number;
  data?: any;
  summary?: string;
  fallbackActive?: boolean;
  message?: string;
}

export class TelemetrySocketService {
  private wss: WebSocketServer | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server bound to HTTP server instance
   */
  init(server: HttpServer, path: string = '/ws'): void {
    if (this.wss) {
      console.log('⚠️ Telemetry WebSocket server already initialized. Reusing.');
      return;
    }

    this.wss = new WebSocketServer({ server, path });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress;
      const latestSession = sessionStore.getLatestSession();
      const allSessions = sessionStore.getAllSessions().slice(0, 10);

      // 1. Connection Acknowledgement
      const ackPayload: TelemetryEvent = {
        type: 'CONNECT_ACK',
        sessionId: latestSession?.sessionId || 'system',
        stage: latestSession?.stage || 'IDLE',
        timestamp: Date.now(),
        data: {
          message: 'Connected to FlowAgent OS Live Telemetry Stream',
          activeSession: latestSession,
          sessions: allSessions,
          connectedClients: this.getConnectedClientCount(),
        },
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(ackPayload));
      }

      // 2. State Replay on Reconnect: Instantly hydrate newly connected client with latest active session
      if (latestSession) {
        const replayPayload: TelemetryEvent = {
          type: 'STATE_REPLAY',
          sessionId: latestSession.sessionId,
          stage: latestSession.stage,
          timestamp: Date.now(),
          elapsedMs: latestSession.telemetry?.totalDurationMs || 0,
          data: {
            session: latestSession,
            invoice: latestSession.invoice,
            compliance: latestSession.compliance,
            routing: latestSession.routing,
            settlement: latestSession.settlement,
            ubotCard: latestSession.ubotCard,
            speechSummary: latestSession.speechSummary,
            audioUrl: latestSession.audioUrl,
            telemetry: latestSession.telemetry,
            error: latestSession.error,
          },
          summary: `[State Replay] Hydrated active session: ${latestSession.sessionId} (${latestSession.stage})`,
        };
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(replayPayload));
        }
        console.log(
          `📡 [TelemetrySocket] Client connected from ${clientIp}. Replayed state for session ${latestSession.sessionId} (${latestSession.stage}).`
        );
      }

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
        } catch {
          // ignore malformed client messages
        }
      });

      ws.on('error', (err) => {
        console.warn(`[TelemetrySocket Client Error ${clientIp}]:`, err.message);
      });
    });

    // Start background ping/pong heartbeat (unref'd so process can exit cleanly)
    this.heartbeatInterval = setInterval(() => {
      this.broadcastHeartbeat();
    }, 20000);
    if (typeof (this.heartbeatInterval as any).unref === 'function') {
      (this.heartbeatInterval as any).unref();
    }

    console.log(`📡 FlowAgent Telemetry WebSocket server active on ${path}`);
  }

  /**
   * Broadcast telemetry payload to all active WebSocket clients
   */
  broadcast(event: TelemetryEvent): void {
    if (!this.wss) return;

    const message = JSON.stringify(event);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (err: any) {
          console.warn('[TelemetrySocket Broadcast Error]:', err.message);
        }
      }
    }
  }

  /**
   * Update session state and emit synchronized stage transition event
   */
  emitStage(
    sessionId: string,
    stage: PipelineStage,
    data?: any,
    elapsedMs?: number,
    summary?: string
  ): TelemetryEvent {
    // 1. Synchronously persist to SessionStore
    const session = sessionStore.updateSession(sessionId, {
      stage,
      ...(data?.invoice ? { invoice: data.invoice } : {}),
      ...(data?.compliance ? { compliance: data.compliance } : {}),
      ...(data?.routing ? { routing: data.routing } : {}),
      ...(data?.settlement ? { settlement: data.settlement } : {}),
      ...(data?.telemetry ? { telemetry: data.telemetry } : {}),
      ...(data?.error ? { error: data.error } : {}),
      ...(data?.ubotCard ? { ubotCard: data.ubotCard } : {}),
      ...(data?.speechSummary ? { speechSummary: data.speechSummary } : {}),
      ...(data?.audioUrl ? { audioUrl: data.audioUrl } : {}),
    });

    // 2. Build structured telemetry event
    const event: TelemetryEvent = {
      type: 'PIPELINE_EVENT',
      sessionId,
      stage,
      timestamp: Date.now(),
      elapsedMs,
      data: {
        ...data,
        session,
      },
      summary,
    };

    // 3. Broadcast to all connected clients
    this.broadcast(event);
    return event;
  }

  /**
   * Send heartbeat to keep sockets fresh
   */
  private broadcastHeartbeat(): void {
    if (!this.wss || this.wss.clients.size === 0) return;
    const heartbeat: TelemetryEvent = {
      type: 'HEARTBEAT',
      sessionId: 'system',
      stage: 'IDLE',
      timestamp: Date.now(),
      data: {
        activeClients: this.wss.clients.size,
      },
    };
    this.broadcast(heartbeat);
  }

  /**
   * Total active connected clients
   */
  getConnectedClientCount(): number {
    return this.wss ? this.wss.clients.size : 0;
  }

  /**
   * Close WebSocket server (for tests/cleanup)
   */
  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      for (const client of this.wss.clients) {
        client.terminate();
      }
      this.wss.close();
      this.wss = null;
    }
  }
}

export const telemetrySocketService = new TelemetrySocketService();
