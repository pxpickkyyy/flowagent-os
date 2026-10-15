import { Router } from 'express';
import multer from 'multer';
import { pipelineController } from '../controllers/pipelineController.js';
import { settlementService } from '../services/settlementService.js';
import { avalancheService } from '../services/avalancheService.js';

export const pipelineRouter = Router();

// Configure multer memory storage for file uploads (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/**
 * POST /api/pipeline/execute
 * Accepts multipart/form-data with 'invoice' field, or raw JSON
 */
pipelineRouter.post(
  '/execute',
  upload.single('invoice'),
  pipelineController.execute.bind(pipelineController)
);

/**
 * GET /api/pipeline/status
 * Quick health and telemetry check on pipeline capabilities
 */
pipelineRouter.get('/status', async (_req, res) => {
  try {
    const avalanche = await avalancheService.ping();
    const balances = await settlementService.getWalletBalances();

    res.json({
      status: 'online',
      pipeline: 'FlowAgent Core Execution & Settlement Pipeline',
      sprint: 'Sprint 1',
      slaLimitMs: 3000,
      avalanche: {
        chainId: avalanche.chainId.toString(),
        isFuji: avalanche.isFuji,
        blockNumber: avalanche.blockNumber,
        gasPrice: avalanche.gasPrice,
      },
      wallet: balances,
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      error: err.message,
    });
  }
});
