import { z } from 'zod';

/**
 * Ethereum/Avalanche 20-byte address format regex
 */
export const EvmAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM Address');

/**
 * Currency code schema
 */
export const CurrencySchema = z.enum(['AVAX', 'USDC', 'USDT', 'USD', 'EUR']);

/**
 * Line item schema within an invoice
 */
export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  amount: z.number().nonnegative('Total item amount cannot be negative'),
});

/**
 * Invoice Extraction Schema (Strict lock for AI & OCR extractions)
 */
export const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  vendor: z.object({
    name: z.string().min(1, 'Vendor name is required'),
    taxId: z.string().optional(),
    walletAddress: EvmAddressSchema.optional(),
    email: z.string().email().optional(),
  }),
  payer: z.object({
    name: z.string().min(1, 'Payer name is required'),
    walletAddress: EvmAddressSchema.optional(),
  }),
  issueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')),
  currency: CurrencySchema,
  items: z.array(InvoiceItemSchema).min(1, 'Invoice must contain at least one line item'),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  totalAmount: z.number().positive('Total amount must be greater than 0'),
  notes: z.string().optional(),
});

/**
 * Payment Intent Status
 */
export const PaymentStatusSchema = z.enum([
  'DRAFT',
  'PENDING_AUTHORIZATION',
  'APPROVED',
  'SUBMITTED_TO_CHAIN',
  'CONFIRMED',
  'FAILED',
  'REJECTED',
]);

/**
 * Payment Intent Schema (Defines blockchain execution payload)
 */
export const PaymentIntentSchema = z.object({
  intentId: z.string().uuid().or(z.string().min(1)),
  invoiceReference: z.string().min(1),
  recipientAddress: EvmAddressSchema,
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a numeric string format'),
  tokenSymbol: z.enum(['AVAX', 'USDC.e', 'USDT']),
  tokenAddress: EvmAddressSchema.optional(), // undefined for native AVAX
  chainId: z.literal(43113).default(43113), // Avalanche Fuji Testnet
  memo: z.string().max(256).optional(),
  status: PaymentStatusSchema.default('DRAFT'),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Tx Hash').optional(),
  voiceNotificationSent: z.boolean().default(false),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

/**
 * Inbound Webhook payload from U-Bot
 */
export const UbotInboundMessageSchema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  sender: z.object({
    id: z.string(),
    role: z.enum(['user', 'bot', 'admin', 'system']),
    name: z.string().optional(),
  }),
  action: z.enum(['PROCESS_INVOICE', 'EXECUTE_PAYMENT', 'QUERY_STATUS', 'VOICE_ALERT']),
  payload: z.record(z.any()),
  timestamp: z.number().default(() => Date.now()),
});

/**
 * Outbound response to U-Bot
 */
export const UbotOutboundMessageSchema = z.object({
  correlationId: z.string(),
  success: z.boolean(),
  replyText: z.string(),
  audioUrl: z.string().url().optional(),
  txHash: z.string().optional(),
  data: z.record(z.any()).optional(),
  timestamp: z.number().default(() => Date.now()),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;
export type UbotInboundMessage = z.infer<typeof UbotInboundMessageSchema>;
export type UbotOutboundMessage = z.infer<typeof UbotOutboundMessageSchema>;

/**
 * Sprint 1 Invoice Data Schema extracted from PDF / Ingestion Engine
 */
export const InvoiceDataSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  recipientAddress: EvmAddressSchema,
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USDC'),
  dueDate: z.string().min(1, 'Due date is required'),
});

export type InvoiceData = z.infer<typeof InvoiceDataSchema>;

/**
 * Compliance check result
 */
export interface ComplianceResult {
  passed: boolean;
  flagReason?: string;
  checkDurationMs: number;
  checkedAddress: string;
  checkedVendor: string;
}

/**
 * Live Route Optimization and Cost Comparison Result
 */
export interface RoutingComparisonResult {
  traditional: {
    rail: 'SWIFT';
    estimatedDuration: string;
    fixedWireFeeUSD: number;
    fxMarkupUSD: number;
    totalCostUSD: number;
  };
  web3: {
    rail: 'Avalanche Fuji';
    estimatedDuration: string;
    gasFeeAvax: string;
    gasFeeUSD: number;
    bridgeLiquidityFeeUSD: number;
    totalCostUSD: number;
  };
  savingsUSD: number;
  savingsPercent: number;
  timeSaved: string;
  recommendation: 'WEB3_AVALANCHE' | 'TRADITIONAL_SWIFT';
}

/**
 * Avalanche Fuji On-Chain Settlement Result
 */
export interface SettlementResult {
  status: 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | 'STANDBY';
  txHash?: string;
  explorerUrl?: string;
  chainId: number;
  blockNumber?: number;
  gasUsed?: string;
  recipientAddress: string;
  amount: number;
  tokenSymbol: string;
  contractAddress?: string;
  broadcastDurationMs: number;
  message?: string;
  gasFeeAvax?: string;
  gasFeeUSD?: number;
}

/**
 * High-resolution execution telemetry
 */
export interface PipelineTelemetry {
  totalDurationMs: number;
  slaLimitMs: number;
  slaCompliance: boolean;
  stepBreakdown: {
    ingestionMs: number;
    complianceMs: number;
    routingMs: number;
    settlementMs: number;
  };
}

/**
 * U-Bot Structured Message Card Block
 */
export interface UbotCardPayload {
  type: 'card';
  version: '1.0';
  title: string;
  subtitle: string;
  status: 'SUCCESS' | 'BLOCKED_COMPLIANCE' | 'FAILED';
  metrics: Array<{
    label: string;
    value: string;
    highlight?: boolean;
  }>;
  actions: Array<{
    type: 'url' | 'button';
    label: string;
    url?: string;
    action?: string;
  }>;
}

/**
 * Unified Pipeline Execution Response
 */
export interface PipelineExecutionResponse {
  success: boolean;
  telemetry: PipelineTelemetry;
  invoice: InvoiceData;
  compliance: ComplianceResult;
  routing: RoutingComparisonResult;
  settlement: SettlementResult;
  speechSummary: string;
  ubotCardPayload: UbotCardPayload;
}

