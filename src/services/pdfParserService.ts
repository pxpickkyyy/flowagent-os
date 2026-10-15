import { extractText } from 'unpdf';
import { GoogleGenAI, Type } from '@google/genai';
import { ENV } from '../config/env.js';
import { InvoiceData, InvoiceDataSchema } from '../schemas/contracts.js';

export class InvoiceIngestionError extends Error {
  public statusCode: number = 400;
  public errorCode: string;
  public actionableResolution: string[];
  public missingFields?: string[];

  constructor(
    message: string,
    options?: {
      errorCode?: string;
      actionableResolution?: string[];
      missingFields?: string[];
    }
  ) {
    super(message);
    this.name = 'InvoiceIngestionError';
    this.errorCode = options?.errorCode || 'MALFORMED_INVOICE_DATA';
    this.actionableResolution = options?.actionableResolution || [
      '1. Provide a non-empty invoice PDF document, text, or structured JSON payload.',
      '2. Ensure an EVM recipient address (0x...) is explicitly visible on the invoice.',
      '3. Ensure the invoice has a valid numerical total amount due.',
    ];
    this.missingFields = options?.missingFields;
    Object.setPrototypeOf(this, InvoiceIngestionError.prototype);
  }
}

export interface ParseOptions {
  mimeType?: string;
  enableLlmFallback?: boolean;
}

export class PdfParserService {
  /**
   * Main entrypoint: Ingests buffer, base64, or text and returns structured InvoiceData
   */
  async parseInvoice(
    input: Buffer | Uint8Array | string,
    options: ParseOptions = {}
  ): Promise<InvoiceData> {
    // Guard 1: Empty or null payload detection
    if (!input) {
      throw new InvoiceIngestionError('Empty invoice payload received.', {
        errorCode: 'EMPTY_INVOICE_PAYLOAD',
        actionableResolution: ['Upload a valid PDF invoice or submit invoice JSON parameters.'],
      });
    }

    if (typeof input === 'string' && input.trim().length === 0) {
      throw new InvoiceIngestionError('Empty text payload received.', {
        errorCode: 'EMPTY_INVOICE_PAYLOAD',
        actionableResolution: ['Provide valid text containing invoice details.'],
      });
    }

    if (Buffer.isBuffer(input) && input.length === 0) {
      throw new InvoiceIngestionError('Empty 0-byte file buffer received.', {
        errorCode: 'EMPTY_INVOICE_PAYLOAD',
        actionableResolution: ['Upload an intact PDF document with non-zero byte size.'],
      });
    }

    let textContent = '';

    if (typeof input === 'string') {
      // Check if base64 encoded
      if (input.startsWith('data:') || /^[A-Za-z0-9+/=]{100,}$/.test(input.trim().slice(0, 150))) {
        try {
          const cleanBase64 = input.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');
          textContent = await this.extractTextFromBuffer(buffer);
        } catch {
          textContent = input;
        }
      } else {
        // Raw text content
        textContent = input;
      }
    } else {
      textContent = await this.extractTextFromBuffer(Buffer.from(input));
    }

    // Step 1: Pattern-First Parser (5-10ms)
    const heuristicData = this.extractRegexHeuristics(textContent);
    const parsed = InvoiceDataSchema.safeParse(heuristicData);

    if (parsed.success) {
      return parsed.data;
    }

    // Step 2: If pattern-first parser missing fields and LLM is enabled (or apiKey present), attempt Gemini 2.5 Flash with 1,500ms timeout
    const apiKey = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (options.enableLlmFallback || (options.enableLlmFallback !== false && apiKey)) {
      try {
        const llmData = await this.fallbackLlmExtractionWithTimeout(textContent, 1500);
        const llmParsed = InvoiceDataSchema.safeParse(llmData);
        if (llmParsed.success) {
          return llmParsed.data;
        }
      } catch (err) {
        // Fallback timed out or failed, continue with best-effort heuristic
      }
    }

    // Identify specifically which required schema parameters are missing
    const missingFields: string[] = [];
    if (!heuristicData.recipientAddress) {
      missingFields.push('recipientAddress (Valid EVM 0x... address)');
    }
    if (!heuristicData.amount || heuristicData.amount <= 0) {
      missingFields.push('amount (Total numerical amount due > 0)');
    }
    if (!heuristicData.invoiceNumber) {
      missingFields.push('invoiceNumber (e.g. INV-2026-001)');
    }

    // If still invalid, throw structured InvoiceIngestionError with HTTP 400 semantics
    throw new InvoiceIngestionError(
      `Invoice parsing failed. Missing essential schema fields: ${missingFields.join(', ')}`,
      {
        errorCode: 'MALFORMED_INVOICE_DATA',
        missingFields,
        actionableResolution: [
          'Verify that the invoice document contains a visible EVM recipient address (0x...) and total amount due.',
          'Resubmit with structured JSON parameters: { invoiceNumber, recipientAddress, amount, currency }.',
        ],
      }
    );
  }

  /**
   * Extracts text layer from buffer. Supports PDF and plaintext.
   */
  private async extractTextFromBuffer(buffer: Buffer): Promise<string> {
    // Check for PDF magic bytes: %PDF-
    const isPdf = buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-');

    if (isPdf) {
      try {
        const uint8 = new Uint8Array(buffer);
        const { text } = await extractText(uint8);
        const joined = Array.isArray(text) ? text.join('\n') : text;
        if (joined && joined.trim().length > 0) {
          return joined;
        }
        return buffer.toString('utf-8');
      } catch (err: any) {
        console.warn(`[PdfParserService] unpdf extraction note: ${err.message}. Treating as raw string.`);
        return buffer.toString('utf-8');
      }
    }

    // Plain text or text file
    return buffer.toString('utf-8');
  }

  /**
   * High-speed heuristic regex pattern extractor (5-10ms)
   */
  extractRegexHeuristics(text: string): Partial<InvoiceData> {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // 1. Recipient EVM address (0x + 40 hex chars)
    // Check for targeted recipient / payee address indicators first to avoid capturing contract/sender addresses
    const contextualAddressMatch = text.match(
      /(?:remit\s*to|pay\s*to|beneficiary|recipient|receiving|wallet|destination|payment|deposit)(?:\s+(?:to|address|account|wallet|info))*\s*[:#]?\s*(0x[a-fA-F0-9]{40})/i
    );

    let recipientAddress: string | undefined;
    if (contextualAddressMatch && contextualAddressMatch[1]) {
      recipientAddress = contextualAddressMatch[1];
    } else {
      // If no contextual indicator, check all EVM addresses, filtering out known contract addresses
      const allAddresses = text.match(/0x[a-fA-F0-9]{40}/g) || [];
      const nonContractAddresses = allAddresses.filter(
        (addr) => addr.toLowerCase() !== '0x5425890298aed601595a70ab815c96711a31bc65'
      );
      recipientAddress = nonContractAddresses[0] || allAddresses[0];
    }

    // 2. Invoice Number
    let invoiceNumber: string | undefined;
    const invMatch =
      text.match(/\b(?:Invoice\s*(?:No|Number|#|ID)|Bill\s*#)\s*[:#]?\s*([A-Za-z0-9-]+)/i) ||
      text.match(/\b(INV-[A-Za-z0-9-]+)\b/i) ||
      text.match(/\bINV\s*#?\s*[:#]\s*([A-Za-z0-9-]+)/i) ||
      text.match(/#\s*([A-Za-z0-9-_]{4,})/);

    if (invMatch && invMatch[1]) {
      const candidate = invMatch[1].trim();
      if (!/^(number|no|date|due|to|id|invoice|commercial)$/i.test(candidate)) {
        invoiceNumber = candidate;
      }
    }

    // 3. Amount extraction
    let amount: number | undefined;
    const amountPatterns = [
      /(?:Total\s*Amount\s*Due|Total\s*Due|Total\s*Amount|Amount\s*Due|Balance\s*Due|Total|Grand\s*Total)\s*[:$]?\s*\$?([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /(?:Amount|Pay)\s*[:$]?\s*\$?([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /\$\s*([0-9,]+(?:\.[0-9]{1,2})?)/,
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:USDC|AVAX|USD|EUR|USDT)/i,
    ];

    for (const pat of amountPatterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const rawNum = match[1].replace(/,/g, '');
        const parsedNum = parseFloat(rawNum);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          amount = parsedNum;
          break;
        }
      }
    }

    // 4. Currency
    let currency = 'USDC';
    const currMatch = text.match(/\b(USDC|AVAX|USD|EUR|USDT)\b/i);
    if (currMatch) {
      currency = currMatch[1].toUpperCase();
    }

    // 5. Due Date
    let dueDate: string | undefined;
    const dateMatch = text.match(
      /(?:Due\s*Date|Payment\s*Due|Due\s*By|Due)\s*[:#]?\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i
    );
    if (dateMatch && dateMatch[1]) {
      dueDate = dateMatch[1];
      // Normalize DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD if needed
      if (dueDate.includes('/')) {
        const parts = dueDate.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          dueDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
    } else {
      // Default to 7 days in the future
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dueDate = d.toISOString().split('T')[0];
    }

    // 6. Vendor Name
    let vendorName: string | undefined;
    const vendorPatterns = [
      /(?:Vendor|From|Biller|Provider|Issuer|Company|Organization)\s*[:#]?\s*([A-Za-z0-9 &.,'-]{3,40})/i,
      /(?:Payable\s*To|Remit\s*To)\s*[:#]?\s*([A-Za-z0-9 &.,'-]{3,40})/i,
    ];

    for (const pat of vendorPatterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const candidate = match[1].trim().replace(/[,\n\r]+$/, '');
        if (candidate.length > 2 && !/^(address|bank|account|date|due)$/i.test(candidate)) {
          vendorName = candidate;
          break;
        }
      }
    }

    // If still not found, examine top lines of text
    if (!vendorName && lines.length > 0) {
      for (const line of lines.slice(0, 4)) {
        if (
          line.length > 2 &&
          !/^(invoice|bill|receipt|statement|tax|date|due|commercial)/i.test(line) &&
          !line.includes('0x') &&
          !line.includes('==')
        ) {
          vendorName = line;
          break;
        }
      }
    }

    return {
      invoiceNumber: invoiceNumber || 'INV-2026-001',
      vendorName: vendorName || 'Unspecified Vendor',
      recipientAddress: recipientAddress as any,
      amount: amount || 0,
      currency,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Fallback Gemini 2.5 Flash structured output extraction with strict 1,500ms timeout race
   */
  private async fallbackLlmExtractionWithTimeout(
    text: string,
    timeoutMs: number = 1500
  ): Promise<Partial<InvoiceData>> {
    const apiKey = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return this.extractRegexHeuristics(text);
    }

    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Gemini extraction timeout exceeded SLA')), timeoutMs);
    });

    const extractionPromise = (async (): Promise<Partial<InvoiceData>> => {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Extract the following commercial invoice parameters into structured JSON:\n\n${text.slice(0, 4000)}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                invoiceNumber: {
                  type: Type.STRING,
                  description: 'Invoice number or ID (e.g. INV-2026-001)',
                },
                vendorName: {
                  type: Type.STRING,
                  description: 'Billing entity or vendor name',
                },
                recipientAddress: {
                  type: Type.STRING,
                  description: 'Valid EVM hex recipient address (0x...)',
                },
                amount: {
                  type: Type.NUMBER,
                  description: 'Total payable amount due',
                },
                currency: {
                  type: Type.STRING,
                  description: 'Currency symbol (USDC, AVAX, USD, EUR, USDT)',
                },
                dueDate: {
                  type: Type.STRING,
                  description: 'Payment due date in YYYY-MM-DD format',
                },
              },
              required: ['invoiceNumber', 'vendorName', 'recipientAddress', 'amount', 'currency', 'dueDate'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const rawAmount = parsed.amount;
          const parsedAmount =
            typeof rawAmount === 'number'
              ? rawAmount
              : parseFloat(String(rawAmount || '0').replace(/[^0-9.]/g, '')) || 0;

          return {
            invoiceNumber: parsed.invoiceNumber,
            vendorName: parsed.vendorName,
            recipientAddress: String(parsed.recipientAddress || '').trim() as any,
            amount: parsedAmount,
            currency: (parsed.currency || 'USDC').toUpperCase(),
            dueDate: parsed.dueDate,
          };
        }
      } catch (err: any) {
        console.warn(`[PdfParserService] Gemini structured output notice: ${err.message}. Falling back to deterministic heuristics.`);
      }

      return this.extractRegexHeuristics(text);
    })();

    try {
      return await Promise.race([extractionPromise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

export const pdfParserService = new PdfParserService();
