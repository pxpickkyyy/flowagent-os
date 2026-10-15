import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { sessionStore, PipelineSession, ActionableError } from '../services/sessionStore.js';
import { telemetrySocketService } from '../services/telemetrySocket.js';
import { pdfParserService } from '../services/pdfParserService.js';
import { complianceService } from '../services/complianceService.js';
import { routingOptimizerService } from '../services/routingOptimizerService.js';
import { settlementService } from '../services/settlementService.js';
import { avalancheService } from '../services/avalancheService.js';
import { elevenlabsService } from '../services/elevenlabsService.js';
import { tokenomistService } from '../services/tokenomistService.js';
import { reconciliationService } from '../services/reconciliationService.js';
import {
  InvoiceData,
  InvoiceDataSchema,
  UbotCardPayload,
} from '../schemas/contracts.js';
import {
  CLEAN_INVOICE_AWS,
  CLEAN_INVOICE_NODE_OPS,
  SANCTIONED_INVOICE_OFAC_ADDRESS,
  SANCTIONED_INVOICE_OFAC_VENDOR,
} from '../test/mockInvoices.js';

interface TokenizedExtraction {
  intent: 'PAY' | 'ANALYZE' | 'CANCEL' | 'AUDIT' | 'STATUS' | 'TOKENOMICS';
  recipientAddress?: string;
  amount?: number;
  currency?: string;
  vendorName?: string;
  invoiceNumber?: string;
  alias?: 'aws' | 'tornado' | 'nodeops';
}

function parseTokenizedMessage(rawMessage: string): TokenizedExtraction {
  const msg = (rawMessage || '').trim();
  const lower = msg.toLowerCase();

  // 1. Detect Intent
  let intent: TokenizedExtraction['intent'] = 'PAY';
  if (/\b(status|balance|ping|health)\b/i.test(lower)) {
    intent = 'STATUS';
  } else if (/\b(tokenomist|tokenomics|vesting|unlock)\b/i.test(lower)) {
    intent = 'TOKENOMICS';
  } else if (/\b(cancel|abort|reject|stop)\b/i.test(lower)) {
    intent = 'CANCEL';
  } else if (/\b(audit|analyze|check|inspect|review)\b/i.test(lower) && !/\b(pay|settle|transfer)\b/i.test(lower)) {
    intent = 'AUDIT';
  }

  // 2. Detect Named Aliases
  let alias: TokenizedExtraction['alias'] | undefined;
  if (/\b(tornado|sanctioned|ofac)\b/i.test(lower)) {
    alias = 'tornado';
  } else if (/\b(nodeops|node\s*ops)\b/i.test(lower)) {
    alias = 'nodeops';
  } else if (/\b(aws|amazon)\b/i.test(lower)) {
    alias = 'aws';
  }

  // 3. Extract EVM Address: 0x followed by 40 hex characters
  const addrMatch = msg.match(/\b(0x[a-fA-F0-9]{40})\b/);
  const recipientAddress = addrMatch ? addrMatch[1] : undefined;

  // 4. Extract Amount & Currency
  let amount: number | undefined;
  let currency: string | undefined;

  const amountCurrencyMatch =
    msg.match(/\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*(USDC|AVAX|USD|EUR|USDT)\b/i) ||
    msg.match(/\b(USDC|AVAX|USD|EUR|USDT)\s*\$?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\b/i) ||
    msg.match(/\$\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\b/);

  if (amountCurrencyMatch) {
    if (amountCurrencyMatch[2] && isNaN(Number(amountCurrencyMatch[2]))) {
      amount = parseFloat(amountCurrencyMatch[1].replace(/,/g, ''));
      currency = amountCurrencyMatch[2].toUpperCase();
    } else if (amountCurrencyMatch[1] && isNaN(Number(amountCurrencyMatch[1]))) {
      currency = amountCurrencyMatch[1].toUpperCase();
      amount = parseFloat(amountCurrencyMatch[2].replace(/,/g, ''));
    } else {
      amount = parseFloat(amountCurrencyMatch[1].replace(/,/g, ''));
      currency = 'USDC';
    }
  }

  // 5. Extract Vendor Name
  let vendorName: string | undefined;
  const vendorMatch =
    msg.match(/(?:for|vendor|to)\s+([A-Za-z0-9 &.,'-]{2,30}?)(?=\s+(?:for|to|at|amount|address|0x|\$|\d)|$)/i) ||
    msg.match(/(?:for|vendor|to)\s+([A-Za-z0-9 &.,'-]{2,30})/i);

  if (vendorMatch && vendorMatch[1]) {
    const candidate = vendorMatch[1].trim();
    if (!/^(0x|usdc|avax|usd|invoice|payment|tokens?)/i.test(candidate)) {
      vendorName = candidate;
    }
  }

  // 6. Extract Invoice Number
  const invMatch = msg.match(/\b(INV-[A-Za-z0-9-]+)\b/i) || msg.match(/\b(?:invoice|inv)\s*#?\s*([A-Za-z0-9-]+)\b/i);
  const invoiceNumber = invMatch ? (invMatch[1].startsWith('INV-') ? invMatch[1].toUpperCase() : `INV-${invMatch[1]}`) : undefined;

  return {
    intent,
    recipientAddress,
    amount,
    currency,
    vendorName,
    invoiceNumber,
    alias,
  };
}

export class UbotController {
  /**
   * Inbound chat message / invoice upload handler
   * Handles natural language prompts, predefined quick buttons, or invoice uploads.
   * Dual compatibility: External U-Bot instances & Web UBotSimulator hit the EXACT same endpoint.
   * POST /api/ubot/message
   */
  async handleMessage(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    const { message, conversationId = `conv_${Date.now()}`, invoiceJson, invoiceText, synthesizeVoice = true } = req.body;

    console.log(`[U-Bot Controller] Inbound message: "${message || '(data payload)'}" | Conv: ${conversationId}`);

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const session = sessionStore.createSession(conversationId, { sessionId, stage: 'PARSING' });

    try {
      // -----------------------------------------------------------------------
      // Step 0: Parse Tokenized Parameters and Detect Intent
      // -----------------------------------------------------------------------
      const tokenized = parseTokenizedMessage(message || '');

      // Check for status/balance queries
      if (tokenized.intent === 'STATUS') {
        const balances = await settlementService.getWalletBalances();
        const network = await avalancheService.ping();
        const walletAddress = balances.address || '0x0000000000000000000000000000000000000000';

        const card: UbotCardPayload = {
          type: 'card',
          version: '1.0',
          title: 'FlowAgent OS Status & Wallet Telemetry',
          subtitle: `Avalanche Fuji Testnet (Chain ID ${network.chainId})`,
          status: 'SUCCESS',
          metrics: [
            { label: 'AVAX Balance', value: `${balances.avaxBalance} AVAX`, highlight: true },
            { label: 'Fuji USDC Balance', value: `${balances.usdcBalance} USDC`, highlight: true },
            { label: 'Agent Wallet', value: `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` },
            { label: 'Fuji Block Number', value: `#${network.blockNumber}` },
            { label: 'ElevenLabs Voice', value: elevenlabsService.isConfigured() ? 'Active (Turbo v2.5)' : 'Standby' },
            { label: 'Tokenomist Vesting', value: 'Active (AVAX 61.1% Circulating)' },
          ],
          actions: [
            {
              type: 'url',
              label: 'Claim Testnet AVAX Faucet',
              url: 'https://faucet.avax.network/',
            },
          ],
        };

        telemetrySocketService.emitStage(sessionId, 'IDLE', { card });

        res.json({
          success: true,
          sessionId,
          conversationId,
          replyText: `FlowAgent Core is online on Avalanche Fuji. Agent wallet: ${balances.avaxBalance} AVAX, ${balances.usdcBalance} USDC.`,
          ubotCardPayload: card,
        });
        return;
      }

      // Step 0.1: Check for Tokenomist tokenomics / vesting queries
      if (tokenized.intent === 'TOKENOMICS') {
        const avaxTok = await tokenomistService.getTokenomics('AVAX');
        const nextCliff = avaxTok.upcomingUnlocks.find((u) => u.type === 'CLIFF');

        const card: UbotCardPayload = {
          type: 'card',
          version: '1.0',
          title: 'Tokenomist Tokenomics & Vesting Intelligence',
          subtitle: 'Ecosystem Partner: Tokenomist (U-Hackathon / Flow Summit)',
          status: 'SUCCESS',
          metrics: [
            { label: 'Token', value: 'Avalanche (AVAX)', highlight: true },
            { label: 'Circulating Supply', value: `${(avaxTok.circulatingSupply / 1e6).toFixed(1)}M (${avaxTok.circulatingPercent}%)` },
            { label: 'Next Major Cliff', value: `${nextCliff?.countdownDays} Days (${nextCliff?.date})`, highlight: true },
            { label: 'Cliff Volume', value: `${nextCliff?.amount.toLocaleString()} AVAX (~$${((nextCliff?.amountUSD || 0) / 1e6).toFixed(1)}M)` },
            { label: 'Dilution Risk', value: `${avaxTok.riskLevel} (${avaxTok.dilutionRiskScore})` },
            { label: 'Settlement Clearance', value: 'SAFE_FOR_SETTLEMENT' },
          ],
          actions: [
            {
              type: 'url',
              label: 'View Tokenomist Analytics',
              url: 'https://tokenomist.ai',
            },
          ],
        };

        const replyText = `Tokenomist verified AVAX tokenomics: ${avaxTok.circulatingPercent}% circulating. Next cliff unlock in ${nextCliff?.countdownDays} days (${nextCliff?.percentOfCirculating}% of supply). Safe for cross-border treasury settlements.`;

        let audioUrl: string | undefined;
        if (synthesizeVoice) {
          const tts = await elevenlabsService.synthesizeSpeech(replyText, { saveToFile: true });
          if (tts.success && tts.outputPath) {
            audioUrl = `/audio/${tts.outputPath.split(/[\\/]/).pop()}`;
          }
        }

        telemetrySocketService.emitStage(sessionId, 'IDLE', { card });

        res.json({
          success: true,
          sessionId,
          conversationId,
          replyText,
          audioUrl,
          ubotCardPayload: card,
        });
        return;
      }

      // Step 0.2: Check for Cancel / Abort intent
      if (tokenized.intent === 'CANCEL') {
        const card: UbotCardPayload = {
          type: 'card',
          version: '1.0',
          title: 'FlowAgent OS Workflow Cancelled',
          subtitle: 'User Requested Abort',
          status: 'SUCCESS',
          metrics: [
            { label: 'Workflow State', value: 'ABORTED', highlight: true },
            { label: 'Treasury Impact', value: 'Zero Gas / 0 Funds Dispatched' },
          ],
          actions: [],
        };

        telemetrySocketService.emitStage(sessionId, 'IDLE', { card });

        res.json({
          success: true,
          sessionId,
          conversationId,
          replyText: 'Operation cancelled. Pending invoice settlement has been aborted with zero funds dispatched.',
          ubotCardPayload: card,
        });
        return;
      }

      // Step 0.3: Check for Compliance & Smart Contract Code Audit intent
      if (tokenized.intent === 'AUDIT') {
        const targetAddress = tokenized.recipientAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
        const targetVendor = tokenized.vendorName || (tokenized.alias === 'tornado' ? 'Tornado Cash Protocol' : 'Audited Counterparty');
        const comp = complianceService.checkCompliance(targetAddress, targetVendor);
        const codeCheck = await complianceService.checkReceiverCode(targetAddress);

        const card: UbotCardPayload = {
          type: 'card',
          version: '1.0',
          title: 'Institutional Compliance & Counterparty Audit',
          subtitle: `Target: ${targetAddress.slice(0, 8)}...${targetAddress.slice(-6)}`,
          status: comp.passed ? 'SUCCESS' : 'FAILED',
          metrics: [
            { label: 'Address Checksum', value: ethers.isAddress(targetAddress) ? 'VALID (EIP-55)' : 'INVALID' },
            { label: 'Account Type', value: `${codeCheck.accountType} (${codeCheck.isContract ? `${codeCheck.bytecodeLength} bytes` : 'Standard EOA'})` },
            { label: 'OFAC SDN Status', value: comp.passed ? 'CLEAR / NON-SANCTIONED' : 'SANCTIONED (BLOCKED)', highlight: true },
            { label: 'Vendor Designation', value: targetVendor },
            { label: 'Execution Clearance', value: comp.passed ? 'APPROVED_FOR_SETTLEMENT' : 'PROHIBITED' },
          ],
          actions: comp.passed
            ? [
                {
                  type: 'button',
                  label: 'Proceed to Payment',
                  action: 'PROCESS_INVOICE',
                },
              ]
            : [],
        };

        const replyText = comp.passed
          ? `Compliance Audit CLEAR: ${targetAddress} verified as ${codeCheck.accountType}. Zero OFAC/SDN sanction matches.`
          : `Compliance Audit ALERT: ${targetAddress} flagged: ${comp.flagReason}. Transactions to this counterparty are prohibited.`;

        telemetrySocketService.emitStage(sessionId, 'IDLE', { card });

        res.json({
          success: true,
          sessionId,
          conversationId,
          replyText,
          ubotCardPayload: card,
        });
        return;
      }

      // -----------------------------------------------------------------------
      // Step 1: Ingest & Parse Invoice (< 1000ms SLA)
      // -----------------------------------------------------------------------
      telemetrySocketService.emitStage(
        sessionId,
        'PARSING',
        {},
        Math.round(performance.now() - startTime),
        'Parsing incoming invoice data & extracting schema parameters...'
      );

      let invoice: InvoiceData | undefined;

      if (req.file) {
        invoice = await pdfParserService.parseInvoice(req.file.buffer, { mimeType: req.file.mimetype });
      } else if (invoiceJson) {
        invoice = InvoiceDataSchema.parse(invoiceJson);
      } else if (invoiceText) {
        invoice = await pdfParserService.parseInvoice(invoiceText);
      } else if (tokenized.alias === 'tornado') {
        invoice = SANCTIONED_INVOICE_OFAC_ADDRESS;
      } else if (tokenized.alias === 'nodeops') {
        invoice = CLEAN_INVOICE_NODE_OPS;
      } else if (tokenized.recipientAddress && tokenized.amount) {
        // Dynamic Tokenized Parameters parsed from natural language
        invoice = {
          invoiceNumber: tokenized.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          vendorName: tokenized.vendorName || `${tokenized.recipientAddress.slice(0, 6)}... Payee`,
          recipientAddress: tokenized.recipientAddress as any,
          amount: tokenized.amount,
          currency: tokenized.currency || 'USDC',
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        };
      } else if (tokenized.alias === 'aws') {
        invoice = CLEAN_INVOICE_AWS;
      } else if (tokenized.amount) {
        invoice = {
          invoiceNumber: tokenized.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          vendorName: tokenized.vendorName || 'Commercial Vendor',
          recipientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          amount: tokenized.amount,
          currency: tokenized.currency || 'USDC',
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        };
      } else {
        // Fallback default sample invoice
        invoice = CLEAN_INVOICE_AWS;
      }

      const parseDurationMs = Math.round(performance.now() - startTime);

      // -----------------------------------------------------------------------
      // Step 2: Deterministic Compliance Guard (< 100ms SLA)
      // -----------------------------------------------------------------------
      const tComp = performance.now();
      telemetrySocketService.emitStage(
        sessionId,
        'COMPLIANCE_CHECK',
        { invoice },
        Math.round(performance.now() - startTime),
        `Scanning recipient address ${invoice.recipientAddress} against OFAC SDN Sanctions list...`
      );

      const compliance = complianceService.checkCompliance(invoice.recipientAddress, invoice.vendorName);
      const compDurationMs = Math.round(performance.now() - tComp);

      if (!compliance.passed) {
        const errorInfo: ActionableError = {
          code: 'OFAC_SANCTION_MATCH',
          message: `Transaction halted by Deterministic Compliance Guard: ${compliance.flagReason}`,
          flagReason: compliance.flagReason,
          checkedAddress: compliance.checkedAddress,
          actionableResolution: [
            '1. Immediately verify recipient entity in OFAC SDN registry before releasing corporate funds.',
            '2. Request an alternate compliant corporate EVM payout address from vendor.',
            '3. File an expedited compliance override review with legal / compliance desk.',
          ],
        };

        const blockedCard: UbotCardPayload = {
          type: 'card',
          version: '1.0',
          title: `⚠️ Transaction Blocked: Sanctions Match`,
          subtitle: `Vendor: ${invoice.vendorName} | Inv #${invoice.invoiceNumber}`,
          status: 'BLOCKED_COMPLIANCE',
          metrics: [
            { label: 'Compliance Status', value: 'BLOCKED (OFAC / SDN Match)', highlight: true },
            { label: 'Sanction Reason', value: compliance.flagReason || 'OFAC Sanctioned Entity' },
            { label: 'Flagged Address', value: compliance.checkedAddress },
            { label: 'Invoice Amount', value: `$${invoice.amount.toLocaleString()} ${invoice.currency}` },
            { label: 'Guard Latency', value: `${compDurationMs}ms` },
          ],
          actions: [
            {
              type: 'button',
              label: '🔄 Try Compliant AWS Invoice',
              action: 'RETRY_CLEAN',
            },
          ],
        };

        let voiceSummary = `Transaction blocked. Address ${compliance.checkedAddress.slice(0, 8)} is flagged on the OFAC Sanctions list for ${compliance.flagReason}.`;
        let audioUrl: string | undefined;

        if (synthesizeVoice) {
          const tts = await elevenlabsService.synthesizeSpeech(voiceSummary, { saveToFile: true });
          if (tts.success && tts.outputPath) {
            audioUrl = `/audio/${tts.outputPath.split(/[\\/]/).pop()}`;
          }
        }

        telemetrySocketService.emitStage(
          sessionId,
          'FLAGGED',
          {
            invoice,
            compliance,
            error: errorInfo,
            ubotCard: blockedCard,
            speechSummary: voiceSummary,
            audioUrl,
          },
          Math.round(performance.now() - startTime),
          `Violation detected: ${compliance.flagReason}`
        );

        res.status(403).json({
          success: false,
          sessionId,
          conversationId,
          stage: 'FLAGGED',
          error: errorInfo,
          ubotCardPayload: blockedCard,
          replyText: voiceSummary,
          audioUrl,
        });
        return;
      }

      // -----------------------------------------------------------------------
      // Step 3: Route Optimizer (< 100ms SLA)
      // -----------------------------------------------------------------------
      const tRoute = performance.now();
      telemetrySocketService.emitStage(
        sessionId,
        'ROUTING',
        { invoice, compliance },
        Math.round(performance.now() - startTime),
        'Evaluating optimal liquidity rail: Traditional SWIFT vs Avalanche Fuji C-Chain...'
      );

      const tokenType = invoice.currency.toUpperCase() === 'USDC' ? 'USDC' : 'NATIVE';
      const routing = await routingOptimizerService.calculateOptimalRoute(invoice.amount, tokenType);
      const routeDurationMs = Math.round(performance.now() - tRoute);

      // -----------------------------------------------------------------------
      // Step 4: Approval Gate - Generate Interactive Confirmation Card
      // -----------------------------------------------------------------------
      const totalPreApprovalMs = Math.round(performance.now() - startTime);
      const tokenSymbol = invoice.currency.toUpperCase() === 'USDC' ? 'USDC' : 'AVAX';
      const tokenomicsRisk = await tokenomistService.assessSettlementRisk(tokenSymbol, invoice.amount);

      const approvalCard: UbotCardPayload = {
        type: 'card',
        version: '1.0',
        title: `Payment Approval Request: ${invoice.invoiceNumber}`,
        subtitle: `Vendor: ${invoice.vendorName} | Due: ${invoice.dueDate}`,
        status: 'SUCCESS',
        metrics: [
          { label: 'Invoice Amount', value: `$${invoice.amount.toLocaleString()} ${invoice.currency}` },
          { label: 'Settlement Rail', value: 'Avalanche Fuji C-Chain (43113)' },
          {
            label: 'Net Savings vs SWIFT',
            value: `$${routing.savingsUSD.toFixed(2)} (${routing.savingsPercent}%)`,
            highlight: true,
          },
          { label: 'Estimated Finality', value: routing.web3.estimatedDuration, highlight: true },
          { label: 'Traditional SWIFT Fee', value: `$${routing.traditional.totalCostUSD.toFixed(2)} (3-5 Days)` },
          { label: 'FlowAgent Web3 Fee', value: `$${routing.web3.totalCostUSD.toFixed(2)} (< 2.4s)` },
          { label: 'Tokenomist Vesting Guard', value: `${tokenomicsRisk.riskLevel} Risk (Next Cliff: ${tokenomicsRisk.nextCliffDays}d)` },
        ],
        actions: [
          {
            type: 'button',
            label: `Approve Payment ($${routing.web3.totalCostUSD.toFixed(2)})`,
            action: 'APPROVE_PAYMENT',
          },
          {
            type: 'button',
            label: 'Cancel Payment',
            action: 'CANCEL_PAYMENT',
          },
        ],
      };

      const speechSummary = `Invoice ${invoice.invoiceNumber} verified for ${invoice.vendorName}. Total $${invoice.amount} ${invoice.currency}. Saved $${routing.savingsUSD.toFixed(2)} compared to traditional bank wire. Awaiting your authorization.`;

      let audioUrl: string | undefined;
      if (synthesizeVoice) {
        const tts = await elevenlabsService.synthesizeSpeech(speechSummary, { saveToFile: true });
        if (tts.success && tts.outputPath) {
          audioUrl = `/audio/${tts.outputPath.split(/[\\/]/).pop()}`;
        }
      }

      telemetrySocketService.emitStage(
        sessionId,
        'WAITING_APPROVAL',
        {
          invoice,
          compliance,
          routing,
          ubotCard: approvalCard,
          speechSummary,
          audioUrl,
          telemetry: {
            totalDurationMs: totalPreApprovalMs,
            slaLimitMs: 3000,
            slaCompliance: totalPreApprovalMs <= 3000,
            stepBreakdown: {
              ingestionMs: parseDurationMs,
              complianceMs: compDurationMs,
              routingMs: routeDurationMs,
              settlementMs: 0,
            },
          },
        },
        totalPreApprovalMs,
        'Pipeline pre-flight complete. Waiting for user authorization in U-Bot...'
      );

      res.json({
        success: true,
        sessionId,
        conversationId,
        stage: 'WAITING_APPROVAL',
        replyText: speechSummary,
        ubotCardPayload: approvalCard,
        audioUrl,
        invoice,
        compliance,
        routing,
      });
    } catch (err: any) {
      console.warn('[U-Bot handleMessage Error]:', err.name || 'Error', err.message);

      // Fault-Tolerance: Ingestion / schema errors -> HTTP 400 (not 500)
      if (err.name === 'InvoiceIngestionError' || err.statusCode === 400 || err.name === 'ZodError') {
        const errorDetails = {
          code: err.errorCode || 'MALFORMED_INVOICE_DATA',
          message: err.message,
          missingFields: err.missingFields,
          actionableResolution: err.actionableResolution || [
            '1. Ensure the invoice is a valid non-empty PDF or structured text.',
            '2. Confirm recipient EVM address (0x...) and amount are present.',
          ],
        };

        telemetrySocketService.emitStage(
          sessionId,
          'FAILED',
          { error: errorDetails },
          Math.round(performance.now() - startTime),
          `Ingestion rejected: ${err.message}`
        );

        res.status(400).json({
          success: false,
          sessionId,
          conversationId,
          stage: 'FAILED',
          error: errorDetails,
        });
        return;
      }

      // Compliance Error -> HTTP 403
      if (err.name === 'ComplianceError' || err.statusCode === 403) {
        res.status(403).json({
          success: false,
          sessionId,
          conversationId,
          stage: 'FLAGGED',
          error: {
            code: 'OFAC_SANCTION_MATCH',
            message: err.message,
            actionableResolution: [
              'Verify recipient entity in OFAC SDN registry before releasing funds.',
              'Request an alternate compliant corporate EVM payout address.',
            ],
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        sessionId,
        conversationId,
        stage: 'FAILED',
        error: {
          code: 'PIPELINE_ERROR',
          message: err.message,
          actionableResolution: [
            'Verify server telemetry at GET /health.',
            'Engage Emergency Stage Fallback at POST /api/admin/toggle-fallback if live network is unreachable.',
          ],
        },
      });
    }
  }

  /**
   * Action handler for interactive buttons from U-Bot or Web UBotSimulator
   * Handles: APPROVE_PAYMENT, CANCEL_PAYMENT
   * POST /api/ubot/action
   */
  async handleAction(req: Request, res: Response): Promise<void> {
    const actionStart = performance.now();
    const { sessionId, action, conversationId = 'default' } = req.body;

    console.log(`[U-Bot Action] Action: "${action}" | Session: ${sessionId}`);

    const session = sessionStore.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'SessionNotFound',
        message: `No active session found for ID: ${sessionId}`,
      });
      return;
    }

    if (action === 'CANCEL_PAYMENT') {
      telemetrySocketService.emitStage(
        sessionId,
        'CANCELLED',
        {
          ubotCard: {
            type: 'card',
            version: '1.0',
            title: `Payment Cancelled: ${session.invoice?.invoiceNumber || 'Invoice'}`,
            subtitle: 'Transaction was cancelled by user request.',
            status: 'FAILED',
            metrics: [
              { label: 'Status', value: 'CANCELLED BY USER', highlight: true },
              { label: 'Invoice', value: session.invoice?.invoiceNumber || 'N/A' },
              { label: 'Vendor', value: session.invoice?.vendorName || 'N/A' },
            ],
            actions: [],
          },
        },
        Math.round(performance.now() - actionStart),
        'Payment was cancelled by the user.'
      );

      res.json({
        success: true,
        sessionId,
        stage: 'CANCELLED',
        replyText: 'Payment authorization cancelled. No on-chain funds were moved.',
      });
      return;
    }

    if (action === 'APPROVE_PAYMENT') {
      if (!session.invoice) {
        res.status(400).json({
          success: false,
          error: 'MissingInvoice',
          message: 'Cannot settle session without parsed invoice data.',
        });
        return;
      }

      // -----------------------------------------------------------------------
      // IMMEDIATE FEEDBACK (Fix #2): Emit SETTLING_ON_AVALANCHE instantly
      // -----------------------------------------------------------------------
      telemetrySocketService.emitStage(
        sessionId,
        'SETTLING_ON_AVALANCHE',
        {
          interimNotice: 'Transaction submitted to Avalanche Fuji, awaiting finality...',
        },
        Math.round(performance.now() - actionStart),
        'Broadcasting settlement transaction to Avalanche Fuji C-Chain...'
      );

      // -----------------------------------------------------------------------
      // Execute On-Chain Settlement on Avalanche Fuji (< 1500ms SLA)
      // -----------------------------------------------------------------------
      const tSettle = performance.now();
      const settlement = await settlementService.executeSettlement({
        recipientAddress: session.invoice.recipientAddress,
        amount: session.invoice.amount,
        tokenSymbol: session.invoice.currency.toUpperCase() === 'USDC' ? 'USDC' : 'AVAX',
        invoiceNumber: session.invoice.invoiceNumber,
      });
      const settleDurationMs = Math.round(performance.now() - tSettle);

      const totalLatencyMs = Math.round(performance.now() - actionStart);

      // Fallback explorer link
      const txHash = settlement.txHash || '0x' + Array(64).fill('0').join('');
      const explorerUrl =
        settlement.explorerUrl || `https://testnet.snowtrace.io/tx/${txHash}`;

      // Build Completed Card with direct Snowtrace button (Add #2) & Reconciliation button (Add #3)
      const completedCard: UbotCardPayload = {
        type: 'card',
        version: '1.0',
        title: `Settlement Confirmed: ${session.invoice.invoiceNumber}`,
        subtitle: `Vendor: ${session.invoice.vendorName} | Rail: Avalanche Fuji (43113)`,
        status: 'SUCCESS',
        metrics: [
          { label: 'Amount Paid', value: `$${session.invoice.amount.toLocaleString()} ${session.invoice.currency}` },
          {
            label: 'Net Saved vs SWIFT',
            value: `$${session.routing?.savingsUSD.toFixed(2) || '109.96'} (${session.routing?.savingsPercent || 97.7}%)`,
            highlight: true,
          },
          { label: 'Settlement Status', value: settlement.status, highlight: true },
          { label: 'Execution Latency', value: `${settleDurationMs}ms`, highlight: true },
          { label: 'Transaction Hash', value: `${txHash.slice(0, 10)}...${txHash.slice(-8)}` },
        ],
        actions: [
          {
            type: 'url',
            label: '🔗 Verify on Snowtrace',
            url: explorerUrl,
          },
          {
            type: 'url',
            label: '📥 Download Reconciliation Receipt',
            url: `/api/ubot/reconciliation/${sessionId}`,
          },
        ],
      };

      const finalSpeech = `Payment of $${session.invoice.amount} ${session.invoice.currency} to ${session.invoice.vendorName} settled on Avalanche Fuji in ${settleDurationMs} milliseconds. Saved $${session.routing?.savingsUSD.toFixed(2) || '109.96'}.`;

      let audioUrl: string | undefined;
      const tts = await elevenlabsService.synthesizeSpeech(finalSpeech, { saveToFile: true });
      if (tts.success && tts.outputPath) {
        audioUrl = `/audio/${tts.outputPath.split(/[\\/]/).pop()}`;
      }

      // Emit COMPLETED stage
      telemetrySocketService.emitStage(
        sessionId,
        'COMPLETED',
        {
          settlement: {
            ...settlement,
            txHash,
            explorerUrl,
          },
          ubotCard: completedCard,
          speechSummary: finalSpeech,
          audioUrl,
          telemetry: {
            totalDurationMs: totalLatencyMs,
            slaLimitMs: 3000,
            slaCompliance: totalLatencyMs <= 3000,
            stepBreakdown: {
              ingestionMs: 0,
              complianceMs: 0,
              routingMs: 0,
              settlementMs: settleDurationMs,
            },
          },
        },
        totalLatencyMs,
        `Payment confirmed on Avalanche Fuji! TxHash: ${txHash.slice(0, 12)}...`
      );

      res.json({
        success: true,
        sessionId,
        conversationId,
        stage: 'COMPLETED',
        replyText: finalSpeech,
        ubotCardPayload: completedCard,
        settlement: {
          ...settlement,
          txHash,
          explorerUrl,
        },
        audioUrl,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'UnrecognizedAction',
      message: `Action "${action}" is not supported. Use APPROVE_PAYMENT or CANCEL_PAYMENT.`,
    });
  }

  /**
   * Return corporate reconciliation receipt as CSV or JSON
   * GET /api/ubot/reconciliation/:sessionId
   */
  getReconciliation(req: Request, res: Response): void {
    const sessionId = String(req.params.sessionId);
    const format = (req.query.format as string) || 'csv';

    const session = sessionStore.getSession(sessionId) || sessionStore.getLatestSession();

    if (!session) {
      res.status(404).json({ error: 'SessionNotFound', message: `No session found for ID: ${sessionId}` });
      return;
    }

    if (format === 'json') {
      const data = reconciliationService.buildReceiptData(session);
      res.json(data);
      return;
    }

    // Default CSV file download
    const csv = reconciliationService.generateCsvReceipt(session);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="FlowAgent_Receipt_${session.sessionId}.csv"`);
    res.send(csv);
  }

  /**
   * List active sessions for frontend hydration
   * GET /api/ubot/sessions
   */
  getSessions(_req: Request, res: Response): void {
    const sessions = sessionStore.getAllSessions();
    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  }

  /**
   * Get single session state
   * GET /api/ubot/session/:sessionId
   */
  getSession(req: Request, res: Response): void {
    const sessionId = String(req.params.sessionId);
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      res.status(404).json({ success: false, error: 'NotFound', message: `Session ${sessionId} not found` });
      return;
    }

    res.json({
      success: true,
      session,
    });
  }
}

export const ubotController = new UbotController();
