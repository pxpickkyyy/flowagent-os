import { PipelineSession } from './sessionStore.js';

export interface ReconciliationReceipt {
  receiptId: string;
  invoiceNumber: string;
  timestamp: string;
  vendorName: string;
  recipientAddress: string;
  settlementRail: string;
  amount: number;
  currency: string;
  txHash: string;
  explorerUrl: string;
  status: string;
  traditionalCostUSD: number;
  flowAgentCostUSD: number;
  netSavingsUSD: number;
  savingsPercent: number;
  complianceStatus: string;
  latencyMs: number;
}

export class ReconciliationService {
  /**
   * Format session data into a structured reconciliation receipt
   */
  buildReceiptData(session: PipelineSession): ReconciliationReceipt {
    const inv = session.invoice;
    const route = session.routing;
    const settle = session.settlement;
    const comp = session.compliance;
    const txHash = settle?.txHash || 'PENDING_OR_STANDBY';
    const explorerUrl =
      settle?.explorerUrl || (txHash.startsWith('0x') ? `https://testnet.snowtrace.io/tx/${txHash}` : 'N/A');

    return {
      receiptId: `REC-${session.sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`,
      invoiceNumber: inv?.invoiceNumber || 'N/A',
      timestamp: new Date(session.updatedAt).toISOString(),
      vendorName: inv?.vendorName || 'Unknown Vendor',
      recipientAddress: inv?.recipientAddress || 'N/A',
      settlementRail: 'Avalanche Fuji C-Chain (Chain ID 43113)',
      amount: inv?.amount || 0,
      currency: inv?.currency || 'USDC',
      txHash,
      explorerUrl,
      status: session.stage,
      traditionalCostUSD: route?.traditional.totalCostUSD || 0,
      flowAgentCostUSD: route?.web3.totalCostUSD || 0,
      netSavingsUSD: route?.savingsUSD || 0,
      savingsPercent: route?.savingsPercent || 0,
      complianceStatus: comp?.passed ? 'PASSED (OFAC / SDN Screened Clean)' : 'FLAGGED',
      latencyMs: session.telemetry?.totalDurationMs || 0,
    };
  }

  /**
   * Generate CSV format for corporate accounting, bookkeeping, and reconciliation
   */
  generateCsvReceipt(session: PipelineSession): string {
    const data = this.buildReceiptData(session);

    const headers = [
      'Receipt_ID',
      'Invoice_Number',
      'Timestamp_UTC',
      'Vendor_Name',
      'Recipient_EVM_Address',
      'Settlement_Rail',
      'Invoice_Amount',
      'Currency',
      'Blockchain_Tx_Hash',
      'Snowtrace_Explorer_URL',
      'Settlement_Status',
      'SWIFT_Estimated_Cost_USD',
      'FlowAgent_Web3_Cost_USD',
      'Net_Savings_USD',
      'Savings_Percentage',
      'Compliance_Status',
      'Total_Pipeline_Latency_ms',
    ];

    const values = [
      data.receiptId,
      data.invoiceNumber,
      data.timestamp,
      `"${data.vendorName.replace(/"/g, '""')}"`,
      data.recipientAddress,
      `"${data.settlementRail}"`,
      data.amount.toFixed(2),
      data.currency,
      data.txHash,
      data.explorerUrl,
      data.status,
      data.traditionalCostUSD.toFixed(2),
      data.flowAgentCostUSD.toFixed(2),
      data.netSavingsUSD.toFixed(2),
      `${data.savingsPercent}%`,
      `"${data.complianceStatus}"`,
      data.latencyMs.toString(),
    ];

    return `${headers.join(',')}\r\n${values.join(',')}\r\n`;
  }
}

export const reconciliationService = new ReconciliationService();
