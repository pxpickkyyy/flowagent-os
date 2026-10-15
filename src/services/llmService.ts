import axios from 'axios';
import { ENV } from '../config/env.js';

export interface LlmChatResult {
  success: boolean;
  replyText: string;
  model: string;
  latencyMs: number;
  reasoningSnippet?: string;
  source: 'DEEPSEEK_V4_1_FLASH' | 'DETERMINISTIC_FALLBACK';
}

const UBOT_SYSTEM_PROMPT = `You are U-Bot, the autonomous accounts payable AI assistant of FlowAgent OS on the Avalanche Fuji C-Chain (Chain ID: 43113) within the u-topia ecosystem.

Core Capabilities & Technical Knowledge:
1. Avalanche Settlement: Executes sub-2.0s deterministic finality via Snowman BFT consensus using Circle native USDC (0x5425890298aed601595a70ab815c96711a31bc65). Eliminates 97.7% of fees vs traditional SWIFT wire ($112.50 bank fee vs $2.54 Fuji settlement on a $2,500 invoice).
2. Deterministic Compliance: Scans recipient addresses and vendors against OFAC/SDN sanctions in < 1ms (instantly halting sanctioned entities like Tornado Cash, Lazarus Group, Garantex). AI never touches private keys or balances.
3. Voice AI: Integrated with ElevenLabs Turbo v2.5 for sub-300ms auditory briefing and emergency sanction siren alerts.
4. Tokenomics Intelligence: Integrated with Tokenomist to audit circulating supply (61.1% AVAX) and upcoming cliff unlock dilution risks (38-day cliff) before authorizing native treasury payouts.
5. Interactive Guidance: Guide users to use Quick Docket buttons (AWS Cloud, Tornado Cash, NodeOps) or type commands like 'Pay AWS $2,500', 'Status', or 'Audit <address>'.

Style Instructions:
- Answer with authoritative, executive financial precision.
- Keep responses strictly between 2 to 3 sentences maximum so ElevenLabs can synthesize speech rapidly.
- Never use markdown bolding in excess or bulleted lists; output flowing prose suitable for both reading and voice playback.`;

export class LlmService {
  private apiKey?: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    const rawKey = ENV.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
    this.apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
    const rawModel = ENV.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4.1-flash';
    this.model = rawModel.replace(/^["']|["']$/g, '').trim();
    const rawBaseUrl = ENV.OPENROUTER_BASE_URL || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.baseUrl = rawBaseUrl.replace(/^["']|["']$/g, '').trim();
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().startsWith('sk-or-v1-'));
  }

  getModelName(): string {
    return this.model;
  }

  /**
   * Generates conversational financial intelligence using DeepSeek V4.1 Flash via OpenRouter
   * Protected with strict timeout race (<= 3500ms) and zero-crash fallback.
   */
  async generateChatResponse(
    userPrompt: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    timeoutMs: number = 3500
  ): Promise<LlmChatResult> {
    const t0 = performance.now();

    if (!this.isConfigured()) {
      return {
        success: false,
        replyText: this.getDeterministicFallback(userPrompt),
        model: this.model,
        latencyMs: Math.round(performance.now() - t0),
        source: 'DETERMINISTIC_FALLBACK',
      };
    }

    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: UBOT_SYSTEM_PROMPT },
      ];

      if (history && history.length > 0) {
        messages.push(...history.slice(-3));
      }

      messages.push({ role: 'user', content: userPrompt });

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          max_tokens: 500, // Ample tokens for DeepSeek reasoning tokens + clean final content
          temperature: 0.25,
          top_p: 0.95,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://flowagent.os',
            'X-Title': 'FlowAgent OS - U-Bot AI Copilot',
            'Content-Type': 'application/json',
          },
          timeout: timeoutMs,
        }
      );

      const latencyMs = Math.round(performance.now() - t0);
      const choice = response.data?.choices?.[0];
      const content = choice?.message?.content?.trim();
      const reasoning = choice?.message?.reasoning?.trim();

      const finalReply = content || reasoning || this.getDeterministicFallback(userPrompt);

      return {
        success: true,
        replyText: finalReply,
        model: this.model,
        latencyMs,
        reasoningSnippet: reasoning ? reasoning.slice(0, 120) : undefined,
        source: 'DEEPSEEK_V4_1_FLASH',
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      console.warn(`[LlmService] OpenRouter/DeepSeek fallback triggered (${err.message}) in ${latencyMs}ms.`);

      return {
        success: false,
        replyText: this.getDeterministicFallback(userPrompt),
        model: this.model,
        latencyMs,
        source: 'DETERMINISTIC_FALLBACK',
      };
    }
  }

  /**
   * High-IQ domain fallback when offline or during Wi-Fi drops
   */
  private getDeterministicFallback(prompt: string): string {
    const lower = (prompt || '').toLowerCase();

    if (lower.includes('tornado') || lower.includes('sanction') || lower.includes('ofac')) {
      return 'FlowAgent OS intercepts sanctioned addresses in sub-1 millisecond via our deterministic OFAC SDN guard. If an invoice targets an entity like Tornado Cash, the settlement button is permanently locked and an emergency ElevenLabs voice alert triggers.';
    }

    if (lower.includes('swift') || lower.includes('wire') || lower.includes('bank') || lower.includes('fee')) {
      return 'FlowAgent OS slashes B2B cross-border payment overhead by 97.7%, reducing a standard $112.50 SWIFT bank toll down to $2.54 on Avalanche Fuji C-Chain with sub-2-second finality.';
    }

    if (lower.includes('tokenomist') || lower.includes('vesting') || lower.includes('cliff')) {
      return 'Our Tokenomist dilution radar audits circulating supply ratios and upcoming cliff schedules before authorizing corporate treasury payouts, protecting against volatility shocks.';
    }

    if (lower.includes('avalanche') || lower.includes('fuji') || lower.includes('snowman')) {
      return 'Settlements are broadcasted to Avalanche Fuji C-Chain using Snowman BFT consensus and native Circle USDC, ensuring instant cryptographic finality with verifiable block hashes.';
    }

    return 'I am U-Bot, your autonomous accounts payable copilot on Avalanche Fuji C-Chain. You can select a Quick Docket preset above to process an invoice, query wallet status, or inspect compliance audits.';
  }

  /**
   * Health ping diagnostic
   */
  async ping(): Promise<{
    success: boolean;
    latencyMs: number;
    model: string;
    sampleReply: string;
  }> {
    const t0 = performance.now();
    const result = await this.generateChatResponse('Summarize FlowAgent OS in 1 sentence.', [], 4000);
    return {
      success: result.success,
      latencyMs: result.latencyMs,
      model: this.model,
      sampleReply: result.replyText,
    };
  }
}

export const llmService = new LlmService();
