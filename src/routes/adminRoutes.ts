import { Router, Request, Response } from 'express';
import { fallbackCacheService } from '../services/fallbackCache.js';
import { resilientRpcProvider } from '../config/resilientRpc.js';
import { elevenlabsCircuitBreaker } from '../middleware/circuitBreaker.js';
import { telemetrySocketService } from '../services/telemetrySocket.js';
import { settlementService } from '../services/settlementService.js';
import { tokenomistService } from '../services/tokenomistService.js';

export const adminRouter = Router();

/**
 * POST /api/admin/toggle-fallback
 * Stage Panic Switch: Toggles in-memory offline fallback mode instantly
 * without requiring a server restart or .env edit.
 */
adminRouter.post('/toggle-fallback', async (req: Request, res: Response) => {
  const currentState = fallbackCacheService.isFallbackActive();
  const nextState = typeof req.body.enabled === 'boolean' ? req.body.enabled : !currentState;

  fallbackCacheService.setRuntimeFallback(nextState);

  // Broadcast WebSocket notification to all active browser windows & HUDs
  telemetrySocketService.broadcast({
    type: 'FALLBACK_MODE_CHANGED',
    fallbackActive: nextState,
    timestamp: Date.now(),
    message: nextState
      ? '🚨 Stage Panic Switch ENGAGED: Offline Verified Cache Active'
      : '🟢 Live Avalanche Fuji On-Chain Settlement Restored',
  });

  res.json({
    success: true,
    fallbackActive: nextState,
    message: nextState
      ? '🚨 Stage Panic Switch ENGAGED: Offline Verified Cache Active'
      : '🟢 Live Avalanche Fuji On-Chain Settlement Restored',
    state: fallbackCacheService.getFallbackState(),
  });
});

/**
 * GET /api/admin/status
 * Presenter HUD & System Telemetry Endpoint
 */
adminRouter.get('/status', async (_req: Request, res: Response) => {
  const fallbackActive = fallbackCacheService.isFallbackActive();
  const rpcInfo = resilientRpcProvider.getActiveEndpoint();
  const voiceInfo = elevenlabsCircuitBreaker.getStatusSummary();
  const balances = await settlementService.getWalletBalances();

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    fallback: {
      active: fallbackActive,
      label: fallbackActive ? '🟠 OFFLINE CACHE (PANIC ACTIVE)' : '🟢 LIVE ON-CHAIN',
      state: fallbackCacheService.getFallbackState(),
    },
    rpc: {
      activeNode: rpcInfo.name,
      url: rpcInfo.url,
      label: resilientRpcProvider.getActiveEndpointLabel(),
      latencyMs: rpcInfo.latencyMs,
    },
    voice: {
      state: voiceInfo.state,
      label: voiceInfo.label,
      isReady: voiceInfo.isReady,
      consecutiveFailures: voiceInfo.consecutiveFailures,
    },
    tokenomist: {
      active: true,
      label: 'Tokenomist: Ready',
      configured: tokenomistService.isConfigured(),
      symbol: 'AVAX',
      nextCliffDays: 38,
      dilutionRisk: 'LOW',
    },
    wallet: balances,
  });
});
