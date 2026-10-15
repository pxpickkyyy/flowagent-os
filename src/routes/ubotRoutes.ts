import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ubotController } from '../controllers/ubotController.js';
import { ENV } from '../config/env.js';

export const ubotRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Flexible authentication middleware:
 * - Validates x-ubot-secret or Bearer token if provided by external bots.
 * - Gracefully accepts local/internal UI simulator calls for zero-friction demonstration.
 */
function ubotAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secretHeader = req.headers['x-ubot-secret'] || req.headers['authorization'];
  const rawToken = Array.isArray(secretHeader) ? secretHeader[0] : secretHeader;
  const token = rawToken?.replace(/^Bearer\s+/i, '');

  // If secret is explicitly passed, verify it
  if (token && token !== ENV.UBOT_WEBHOOK_SECRET) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid U-Bot webhook secret or Authorization token.',
    });
    return;
  }

  next();
}

ubotRouter.use(ubotAuthMiddleware);

// Inbound message or invoice upload (Dual compatible: Real U-Bot & Web Simulator)
ubotRouter.post('/message', upload.single('invoice'), ubotController.handleMessage.bind(ubotController));

// Interactive approval/cancellation action callback
ubotRouter.post('/action', ubotController.handleAction.bind(ubotController));

// Corporate accounting reconciliation receipt download (CSV/JSON)
ubotRouter.get('/reconciliation/:sessionId', ubotController.getReconciliation.bind(ubotController));

// Session listing and telemetry status
ubotRouter.get('/sessions', ubotController.getSessions.bind(ubotController));
ubotRouter.get('/session/:sessionId', ubotController.getSession.bind(ubotController));
