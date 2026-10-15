import { Router, Request, Response } from 'express';
import { tokenomistService } from '../services/tokenomistService.js';

export const tokenomistRouter = Router();

/**
 * GET /api/tokenomist/token/:symbol
 * Returns full Tokenomist tokenomics, vesting schedules & unlock events for a token
 */
tokenomistRouter.get('/token/:symbol', async (req: Request, res: Response) => {
  try {
    const rawSymbol = req.params.symbol;
    const symbol = typeof rawSymbol === 'string' ? rawSymbol : 'AVAX';
    const data = await tokenomistService.getTokenomics(symbol);
    res.json({
      success: true,
      partner: 'Tokenomist',
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'TokenomistFetchError',
      message: err.message,
    });
  }
});

/**
 * GET /api/tokenomist/summary
 * Returns ecosystem overview for Avalanche C-Chain & supported settlement tokens
 */
tokenomistRouter.get('/summary', async (_req: Request, res: Response) => {
  try {
    const avax = await tokenomistService.getTokenomics('AVAX');
    const usdc = await tokenomistService.getTokenomics('USDC');
    const riskCheck = await tokenomistService.assessSettlementRisk('AVAX', 2500);

    res.json({
      success: true,
      partner: 'Tokenomist',
      partnerSlogan: 'Token unlock, vesting and tokenomics data',
      status: 'ACTIVE',
      tokens: {
        AVAX: avax,
        USDC: usdc,
      },
      settlementRiskAssessment: riskCheck,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'TokenomistSummaryError',
      message: err.message,
    });
  }
});

/**
 * GET /api/tokenomist/health
 * Ping endpoint for stage check and monitoring
 */
tokenomistRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const pingRes = await tokenomistService.ping();
    res.json({
      ...pingRes,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
