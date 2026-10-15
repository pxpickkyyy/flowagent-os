import { Router, Request, Response } from 'express';
import axios from 'axios';
import { ENV } from '../config/env.js';
import {
  UbotInboundMessageSchema,
  UbotOutboundMessage,
  InvoiceSchema,
  PaymentIntentSchema,
} from '../schemas/contracts.js';
import { avalancheService } from '../services/avalancheService.js';
import { elevenlabsService } from '../services/elevenlabsService.js';

export const ubotWebhookRouter = Router();

/**
 * Authentication Middleware for Webhook security
 */
function verifyUbotAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'] || req.headers['x-ubot-secret'];
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  // Match Bearer token or direct token
  const secret = token?.replace(/^Bearer\s+/i, '');

  if (secret !== ENV.UBOT_WEBHOOK_SECRET) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid U-Bot webhook secret or Authorization token',
    });
    return;
  }
  next();
}

/**
 * Inbound Webhook Endpoint for U-Bot
 * POST /api/webhook/ubot/inbound
 */
ubotWebhookRouter.post('/inbound', verifyUbotAuth, async (req: Request, res: Response): Promise<void> => {
  const parseResult = UbotInboundMessageSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid message schema',
      details: parseResult.error.format(),
    });
    return;
  }

  const message = parseResult.data;
  console.log(`[U-Bot Inbound] Action: ${message.action} | Conv: ${message.conversationId}`);

  let replyText = '';
  let txHash: string | undefined;
  let audioUrl: string | undefined;
  let data: Record<string, any> = {};

  try {
    switch (message.action) {
      case 'PROCESS_INVOICE': {
        const invoiceValidation = InvoiceSchema.safeParse(message.payload);
        if (!invoiceValidation.success) {
          replyText = `Invoice validation failed: ${JSON.stringify(invoiceValidation.error.format())}`;
          data = { valid: false, errors: invoiceValidation.error.format() };
        } else {
          const inv = invoiceValidation.data;
          replyText = `Invoice #${inv.invoiceNumber} from ${inv.vendor.name} for ${inv.totalAmount} ${inv.currency} parsed and validated.`;
          data = { valid: true, invoice: inv };
        }
        break;
      }

      case 'EXECUTE_PAYMENT': {
        const paymentValidation = PaymentIntentSchema.safeParse(message.payload);
        if (!paymentValidation.success) {
          replyText = `Payment intent schema validation failed: ${JSON.stringify(paymentValidation.error.format())}`;
          data = { valid: false, errors: paymentValidation.error.format() };
        } else {
          const payment = paymentValidation.data;
          const txRes = await avalancheService.executePayment(payment);
          txHash = txRes.txHash;
          replyText = `Payment of ${payment.amount} ${payment.tokenSymbol} to ${payment.recipientAddress} submitted. Status: ${txRes.status}`;
          data = { payment, txResult: txRes };
        }
        break;
      }

      case 'VOICE_ALERT': {
        const textToSpeak = message.payload.text || 'FlowAgent OS notification.';
        const ttsRes = await elevenlabsService.synthesizeSpeech(textToSpeak, {
          saveToFile: true,
        });
        if (ttsRes.success && ttsRes.outputPath) {
          replyText = `Voice alert generated successfully (${ttsRes.bytesCount} bytes).`;
          audioUrl = `/audio/${ttsRes.outputPath.split(/[\\/]/).pop()}`;
        } else {
          replyText = `Voice alert generation failed: ${ttsRes.error}`;
        }
        data = { tts: ttsRes };
        break;
      }

      case 'QUERY_STATUS': {
        const network = await avalancheService.ping();
        replyText = `FlowAgent OS active on Avalanche (Chain ID: ${network.chainId.toString()}, Block: ${network.blockNumber}). ElevenLabs: ${
          elevenlabsService.isConfigured() ? 'Connected' : 'Missing API Key'
        }`;
        data = { network, elevenlabsReady: elevenlabsService.isConfigured() };
        break;
      }

      default:
        replyText = `Unrecognized action: ${(message as any).action}`;
    }

    const outboundResponse: UbotOutboundMessage = {
      correlationId: message.messageId,
      success: true,
      replyText,
      audioUrl,
      txHash,
      data,
      timestamp: Date.now(),
    };

    // Forward to outbound webhook if configured
    if (ENV.UBOT_OUTBOUND_WEBHOOK_URL && ENV.UBOT_OUTBOUND_WEBHOOK_URL !== '') {
      try {
        await axios.post(ENV.UBOT_OUTBOUND_WEBHOOK_URL, outboundResponse, {
          headers: {
            'x-ubot-secret': ENV.UBOT_WEBHOOK_SECRET,
          },
          timeout: 4000,
        });
      } catch (err: any) {
        console.warn(`[U-Bot Outbound Dispatch Note] Could not notify outbound webhook: ${err.message}`);
      }
    }

    res.status(200).json(outboundResponse);
  } catch (error: any) {
    res.status(500).json({
      correlationId: message.messageId,
      success: false,
      replyText: `Error processing ${message.action}: ${error.message}`,
      timestamp: Date.now(),
    });
  }
});

/**
 * Mock outbound receiver endpoint for local testing and loops
 * POST /api/webhook/ubot/mock-receiver
 */
ubotWebhookRouter.post('/mock-receiver', (req: Request, res: Response) => {
  console.log('[U-Bot Outbound Mock Receiver] Received notification payload:', req.body);
  res.status(200).json({ received: true, timestamp: Date.now() });
});
