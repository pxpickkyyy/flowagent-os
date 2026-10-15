import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ComplianceError } from '../services/complianceService.js';
import { InvoiceIngestionError } from '../services/pdfParserService.js';

/**
 * Global Express Error Handling Middleware:
 * Traps all uncaught controller exceptions and transforms them into
 * standard JSON responses with actionable resolutions.
 */
export function globalErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Deterministic Compliance Check Failure -> 403 Forbidden
  if (err instanceof ComplianceError || err.name === 'ComplianceError') {
    res.status(403).json({
      success: false,
      error: 'ComplianceError',
      message: err.message,
      complianceResult: err.complianceResult,
      actionableResolution: [
        '1. Verify counterparty identity against OFAC SDN & international sanction registries.',
        '2. Obtain an alternate approved corporate payout address from the supplier.',
        '3. Request an expedited compliance desk review for lawful exemption.',
      ],
    });
    return;
  }

  // 2. Invoice Ingestion & Parsing Fault -> 400 Bad Request
  if (err instanceof InvoiceIngestionError || err.name === 'InvoiceIngestionError') {
    res.status(400).json({
      success: false,
      error: err.errorCode || 'MALFORMED_INVOICE_DATA',
      message: err.message,
      missingFields: err.missingFields,
      actionableResolution: err.actionableResolution || [
        'Verify invoice file is a non-empty PDF or valid text document.',
        'Ensure EVM payout address (0x...) and total amount due are present in text.',
        'Verify document structure against U-Bot Invoice schema standards.',
      ],
    });
    return;
  }

  // 3. Schema Validation Failures (Zod) -> 400 Bad Request
  if (err instanceof ZodError) {
    const formatted = err.format();
    res.status(400).json({
      success: false,
      error: 'SchemaValidationError',
      message: 'Payload failed strict schema validation standards',
      details: formatted,
      actionableResolution: [
        'Check request body fields match the required contract schema.',
        'Ensure addresses are 40-character hex strings prefixed with 0x.',
        'Ensure amounts are positive numbers.',
      ],
    });
    return;
  }

  // 4. File Upload Failures (Multer) -> 400 Bad Request
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: 'FileUploadError',
      message: `File upload failed: ${err.message}`,
      actionableResolution: [
        'Ensure uploaded invoice file size is less than 10MB.',
        'Submit file with field name "invoice".',
      ],
    });
    return;
  }

  // 5. Catch-all: Safe 500 without crashing the Node runtime
  console.error('🛡️ [GlobalErrorHandler] Unhandled route error caught safely:', err);
  const status = typeof err.statusCode === 'number' && err.statusCode >= 400 ? err.statusCode : 500;

  res.status(status).json({
    success: false,
    error: err.name || 'InternalServiceError',
    message: err.message || 'An unexpected operational error occurred',
    actionableResolution: [
      'Check server telemetry diagnostics at GET /health.',
      'If live testnet RPCs are unstable, engage Emergency Stage Fallback at POST /api/admin/toggle-fallback.',
    ],
  });
}

/**
 * Process-Level Uncaught Exception & Unhandled Rejection Traps:
 * Prevents on-stage Node.js process termination under erratic network conditions.
 */
export function initProcessErrorTraps(): void {
  process.on('uncaughtException', (err: Error) => {
    console.error('🛡️ [ProcessTrap:UncaughtException] Prevented process exit. Error:', err.message);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(0, 4).join('\n'));
    }
  });

  process.on('unhandledRejection', (reason: any) => {
    console.warn(
      '🛡️ [ProcessTrap:UnhandledRejection] Prevented process exit. Reason:',
      reason?.message || reason
    );
  });

  console.log('🛡️ Process-level zero-crash error traps initialized.');
}
