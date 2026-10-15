import {
  InvoiceData,
  ComplianceResult,
  RoutingComparisonResult,
  SettlementResult,
  PipelineTelemetry,
  UbotCardPayload,
} from '../schemas/contracts.js';

export type PipelineStage =
  | 'IDLE'
  | 'PARSING'
  | 'COMPLIANCE_CHECK'
  | 'ROUTING'
  | 'WAITING_APPROVAL'
  | 'SETTLING_ON_AVALANCHE'
  | 'COMPLETED'
  | 'FLAGGED'
  | 'CANCELLED'
  | 'FAILED';

export interface ActionableError {
  code: string;
  message: string;
  flagReason?: string;
  checkedAddress?: string;
  actionableResolution: string[];
}

export interface PipelineSession {
  sessionId: string;
  conversationId: string;
  stage: PipelineStage;
  invoice?: InvoiceData;
  compliance?: ComplianceResult;
  routing?: RoutingComparisonResult;
  settlement?: SettlementResult;
  telemetry?: PipelineTelemetry;
  error?: ActionableError;
  ubotCard?: UbotCardPayload;
  speechSummary?: string;
  audioUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export class SessionStore {
  private sessions = new Map<string, PipelineSession>();

  /**
   * Create a new session or reset an existing one
   */
  createSession(conversationId: string, initialData?: Partial<PipelineSession>): PipelineSession {
    const sessionId = initialData?.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const session: PipelineSession = {
      sessionId,
      conversationId,
      stage: initialData?.stage || 'IDLE',
      invoice: initialData?.invoice,
      compliance: initialData?.compliance,
      routing: initialData?.routing,
      settlement: initialData?.settlement,
      telemetry: initialData?.telemetry,
      error: initialData?.error,
      ubotCard: initialData?.ubotCard,
      speechSummary: initialData?.speechSummary,
      audioUrl: initialData?.audioUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get session by sessionId
   */
  getSession(sessionId: string): PipelineSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Find most recent session by conversationId
   */
  findSessionByConversation(conversationId: string): PipelineSession | undefined {
    const list = Array.from(this.sessions.values()).filter((s) => s.conversationId === conversationId);
    if (list.length === 0) return undefined;
    return list.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }

  /**
   * Update an existing session
   */
  updateSession(sessionId: string, updates: Partial<PipelineSession>): PipelineSession {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(updates.conversationId || 'default', { sessionId, ...updates });
    } else {
      Object.assign(session, updates, { updatedAt: Date.now() });
    }
    return session;
  }

  /**
   * Get all active sessions (newest first)
   */
  getAllSessions(): PipelineSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Get the most recent active session
   */
  getLatestSession(): PipelineSession | undefined {
    const all = this.getAllSessions();
    return all.length > 0 ? all[0] : undefined;
  }

  /**
   * Clear all sessions (for tests)
   */
  clear(): void {
    this.sessions.clear();
  }
}

export const sessionStore = new SessionStore();
