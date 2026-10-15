import { Request, Response } from 'express';
import { pdfParserService } from '../services/pdfParserService.js';
import { complianceService, ComplianceError } from '../services/complianceService.js';
import { routingOptimizerService } from '../services/routingOptimizerService.js';
import { settlementService } from '../services/settlementService.js';
import {
  InvoiceData,
  InvoiceDataSchema,
  PipelineExecutionResponse,
  PipelineTelemetry,
  UbotCardPayload,
} from '../schemas/contracts.js';

export class PipelineController {
  /**
   * Main Pipeline execution handler: Ingest -> Comply -> Route -> Settle (< 3.0s SLA)
   * POST /api/pipeline/execute
   */
  async execute(req: Request, res: Response): Promise<void> {
    const pipelineStart = performance.now();
    let ingestionDurationMs = 0;
    let complianceDurationMs = 0;
    let routingDurationMs = 0;
    let settlementDurationMs = 0;

    let invoice: InvoiceData | undefined;

    try {
      // -----------------------------------------------------------------------
      // Step 1: PDF / Data Ingestion (<= 1000ms SLA)
      // -----------------------------------------------------------------------
      const tStep1 = performance.now();

      if (req.file) {
        // Multipart file upload (PDF or image)
        invoice = await pdfParserService.parseInvoice(req.file.buffer, {
          mimeType: req.file.mimetype,
        });
      } else if (req.body.invoiceJson || req.body.invoice) {
        // Direct JSON invoice payload
        const rawJson = req.body.invoiceJson || req.body.invoice;
        invoice = InvoiceDataSchema.parse(rawJson);
      } else if (req.body.invoiceBase64) {
        // Base64 encoded file
        invoice = await pdfParserService.parseInvoice(req.body.invoiceBase64);
      } else if (req.body.invoiceText) {
        // Raw plaintext invoice
        invoice = await pdfParserService.parseInvoice(req.body.invoiceText);
      } else {
        // If body itself matches schema directly
        const directParse = InvoiceDataSchema.safeParse(req.body);
        if (directParse.success) {
          invoice = directParse.data;
        } else {
          res.status(400).json({
            success: false,
            error: 'BadRequest',
            message: 'No valid invoice provided. Upload a file, base64 buffer, or JSON invoice payload.',
          });
          return;
        }
      }

      ingestionDurationMs = Math.round(performance.now() - tStep1);

      // -----------------------------------------------------------------------
      // Step 2: Deterministic Compliance Guard (<= 100ms SLA)
      // -----------------------------------------------------------------------
      const tStep2 = performance.now();
      const compliance = complianceService.checkCompliance(
        invoice.recipientAddress,
        invoice.vendorName
      );
      complianceDurationMs = Math.round(performance.now() - tStep2);

      // Abort immediately on compliance violation with HTTP 403
      if (!compliance.passed) {
        const totalDurationMs = Math.round(performance.now() - pipelineStart);
        const telemetry: PipelineTelemetry = {
          totalDurationMs,
          slaLimitMs: 3000,
          slaCompliance: totalDurationMs <= 3000,
          stepBreakdown: {
            ingestionMs: ingestionDurationMs,
            complianceMs: complianceDurationMs,
            routingMs: 0,
            settlementMs: 0,
          },
        };

        const ubotCardPayload: UbotCardPayload = {
          type: 'card',
          version: '1.0',
          title: `Compliance Blocked: Invoice #${invoice.invoiceNumber}`,
          subtitle: `Vendor: ${invoice.vendorName}`,
          status: 'BLOCKED_COMPLIANCE',
          metrics: [
            { label: 'Status', value: 'BLOCKED (OFAC / Sanction Match)', highlight: true },
            { label: 'Reason', value: compliance.flagReason || 'Sanctioned entity' },
            { label: 'Checked Address', value: compliance.checkedAddress },
            { label: 'Scan Time', value: `${complianceDurationMs}ms` },
          ],
          actions: [],
        };

        res.status(403).json({
          success: false,
          error: 'ComplianceError',
          message: `Transaction blocked: ${compliance.flagReason}`,
          compliance,
          telemetry,
          ubotCardPayload,
        });
        return;
      }

      // -----------------------------------------------------------------------
      // Step 3: Route Cost & Latency Optimization (<= 100ms SLA)
      // -----------------------------------------------------------------------
      const tStep3 = performance.now();
      const tokenType = invoice.currency.toUpperCase() === 'USDC' ? 'USDC' : 'NATIVE';
      const routing = await routingOptimizerService.calculateOptimalRoute(
        invoice.amount,
        tokenType
      );
      routingDurationMs = Math.round(performance.now() - tStep3);

      // -----------------------------------------------------------------------
      // Step 4: Avalanche Fuji On-Chain Settlement (<= 1500ms SLA, Optimistic)
      // -----------------------------------------------------------------------
      const tStep4 = performance.now();
      const settlement = await settlementService.executeSettlement({
        recipientAddress: invoice.recipientAddress,
        amount: invoice.amount,
        tokenSymbol: invoice.currency.toUpperCase() === 'USDC' ? 'USDC' : 'AVAX',
        invoiceNumber: invoice.invoiceNumber,
      });
      settlementDurationMs = Math.round(performance.now() - tStep4);

      // -----------------------------------------------------------------------
      // Step 5: Format Telemetry & Responses (ElevenLabs + U-Bot Ready)
      // -----------------------------------------------------------------------
      const totalDurationMs = Math.round(performance.now() - pipelineStart);
      const telemetry: PipelineTelemetry = {
        totalDurationMs,
        slaLimitMs: 3000,
        slaCompliance: totalDurationMs <= 3000,
        stepBreakdown: {
          ingestionMs: ingestionDurationMs,
          complianceMs: complianceDurationMs,
          routingMs: routingDurationMs,
          settlementMs: settlementDurationMs,
        },
      };

      const speechSummary = `Invoice ${invoice.invoiceNumber} verified for ${invoice.vendorName}. Saved $${routing.savingsUSD.toFixed(
        2
      )} via Avalanche Fuji. Transaction broadcasted to testnet in ${totalDurationMs} milliseconds.`;

      const ubotCardPayload: UbotCardPayload = {
        type: 'card',
        version: '1.0',
        title: `FlowAgent Settlement: ${invoice.invoiceNumber}`,
        subtitle: `Vendor: ${invoice.vendorName} | Due: ${invoice.dueDate}`,
        status: 'SUCCESS',
        metrics: [
          { label: 'Amount', value: `$${invoice.amount.toLocaleString()} ${invoice.currency}` },
          { label: 'Settlement Rail', value: 'Avalanche Fuji (43113)' },
          {
            label: 'Saved vs SWIFT',
            value: `$${routing.savingsUSD.toFixed(2)} (${routing.savingsPercent}%)`,
            highlight: true,
          },
          { label: 'Estimated Finality', value: routing.web3.estimatedDuration },
          { label: 'E2E Pipeline Latency', value: `${totalDurationMs}ms`, highlight: true },
          { label: 'Status', value: settlement.status },
        ],
        actions: settlement.explorerUrl
          ? [
              {
                type: 'url',
                label: 'View on Snowtrace',
                url: settlement.explorerUrl,
              },
            ]
          : [],
      };

      const responsePayload: PipelineExecutionResponse = {
        success: true,
        telemetry,
        invoice,
        compliance,
        routing,
        settlement,
        speechSummary,
        ubotCardPayload,
      };

      res.status(200).json(responsePayload);
    } catch (err: any) {
      const totalDurationMs = Math.round(performance.now() - pipelineStart);
      console.warn('[Pipeline Execution Intercepted]:', err.name || 'Error', err.message);

      // Fault-Tolerance: Ingestion / Schema error -> HTTP 400 (not 500)
      if (err.name === 'InvoiceIngestionError' || err.statusCode === 400 || err.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: err.errorCode || err.name || 'MalformedInvoiceError',
          message: err.message || 'Invoice data could not be validated against required schema.',
          missingFields: err.missingFields,
          actionableResolution: err.actionableResolution || [
            '1. Ensure the invoice file contains a visible EVM recipient address (0x...).',
            '2. Ensure the invoice specifies a valid numeric total amount due.',
            '3. Check that the uploaded file is not empty or corrupted.',
          ],
          telemetry: {
            totalDurationMs,
            slaLimitMs: 3000,
            slaCompliance: totalDurationMs <= 3000,
            stepBreakdown: {
              ingestionMs: ingestionDurationMs,
              complianceMs: complianceDurationMs,
              routingMs: routingDurationMs,
              settlementMs: settlementDurationMs,
            },
          },
        });
        return;
      }

      // Compliance Error -> HTTP 403
      if (err.name === 'ComplianceError' || err.statusCode === 403) {
        res.status(403).json({
          success: false,
          error: 'ComplianceError',
          message: err.message,
          compliance: err.complianceResult,
          actionableResolution: [
            '1. Immediately verify recipient entity in OFAC SDN registry before releasing funds.',
            '2. Request an alternate compliant corporate payout address.',
          ],
          telemetry: {
            totalDurationMs,
            slaLimitMs: 3000,
            slaCompliance: totalDurationMs <= 3000,
            stepBreakdown: {
              ingestionMs: ingestionDurationMs,
              complianceMs: complianceDurationMs,
              routingMs: routingDurationMs,
              settlementMs: settlementDurationMs,
            },
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: err.name || 'PipelineExecutionError',
        message: err.message || 'An unexpected error occurred during pipeline execution',
        actionableResolution: [
          'Verify server telemetry at GET /health.',
          'If live RPC nodes are unavailable, toggle Emergency Stage Fallback at POST /api/admin/toggle-fallback.',
        ],
        telemetry: {
          totalDurationMs,
          slaLimitMs: 3000,
          slaCompliance: false,
          stepBreakdown: {
            ingestionMs: ingestionDurationMs,
            complianceMs: complianceDurationMs,
            routingMs: routingDurationMs,
            settlementMs: settlementDurationMs,
          },
        },
      });
    }
  }
}

export const pipelineController = new PipelineController();

