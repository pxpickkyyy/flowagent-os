import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.js';
import { elevenlabsCircuitBreaker } from '../middleware/circuitBreaker.js';

export interface TTSResult {
  success: boolean;
  audioBuffer?: Buffer;
  outputPath?: string;
  bytesCount?: number;
  error?: string;
  degraded?: boolean;
}

export class ElevenLabsService {
  private client?: ElevenLabsClient;

  constructor() {
    if (ENV.ELEVENLABS_API_KEY && ENV.ELEVENLABS_API_KEY.trim() !== '') {
      this.client = new ElevenLabsClient({
        apiKey: ENV.ELEVENLABS_API_KEY,
      });
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  /**
   * Synthesize speech using ElevenLabs API protected by Circuit Breaker
   * Degrades gracefully to silent text on timeout or rate limit (HTTP 429)
   */
  async synthesizeSpeech(
    text: string,
    options?: {
      voiceId?: string;
      modelId?: string;
      saveToFile?: boolean;
      filename?: string;
      timeoutMs?: number;
    }
  ): Promise<TTSResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'ELEVENLABS_API_KEY is not configured. Add ELEVENLABS_API_KEY to your .env file.',
        degraded: true,
      };
    }

    const timeoutLimit = options?.timeoutMs ?? 2500;

    const breakerRes = await elevenlabsCircuitBreaker.execute<TTSResult>(
      async () => {
        const voice = options?.voiceId || ENV.ELEVENLABS_VOICE_ID;
        const model = options?.modelId || ENV.ELEVENLABS_MODEL_ID;

        const audioStream = await this.client!.textToSpeech.convert(voice, {
          text,
          model_id: model,
        });

        const chunks: Uint8Array[] = [];
        for await (const chunk of audioStream) {
          chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        let outputPath: string | undefined;

        if (options?.saveToFile) {
          const outDir = path.resolve(process.cwd(), 'public', 'audio');
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }
          const file = options.filename || `speech_${Date.now()}.mp3`;
          outputPath = path.join(outDir, file);
          fs.writeFileSync(outputPath, audioBuffer);
        }

        return {
          success: true,
          audioBuffer,
          outputPath,
          bytesCount: audioBuffer.length,
        };
      },
      {
        success: false,
        degraded: true,
        error: `Voice circuit breaker active: degraded to silent text (< ${timeoutLimit}ms SLA preserved).`,
      },
      timeoutLimit
    );

    if (breakerRes.degraded) {
      return {
        success: false,
        degraded: true,
        error: breakerRes.error || 'Voice synthesis degraded to silent text',
      };
    }

    return breakerRes.result;
  }

  /**
   * Health ping / connectivity test
   * Tests speech synthesis capability without requiring user_read or voices_read API key scopes
   */
  async ping(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (!this.client) {
      return { success: false, latencyMs: 0, message: 'ELEVENLABS_API_KEY is not configured' };
    }
    const t0 = performance.now();
    try {
      const audioStream = await this.client.textToSpeech.convert(ENV.ELEVENLABS_VOICE_ID, {
        text: 'System online',
        model_id: ENV.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5',
      });
      let bytes = 0;
      for await (const chunk of audioStream) {
        bytes += chunk.length;
      }
      const latencyMs = Math.round(performance.now() - t0);
      return {
        success: bytes > 0,
        latencyMs,
        message: `Connected: Generated ${bytes} bytes in ${latencyMs}ms (${ENV.ELEVENLABS_MODEL_ID})`,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - t0);
      return {
        success: false,
        latencyMs,
        message: err.message,
      };
    }
  }

  /**
   * List available voices for validation
   */
  async getVoices() {
    if (!this.client) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }
    try {
      const response = await this.client.voices.getAll();
      return response.voices;
    } catch {
      // If key lacks voices_read permission, return configured default voice
      return [{ voice_id: ENV.ELEVENLABS_VOICE_ID, name: 'Configured Default Voice' }];
    }
  }
}

export const elevenlabsService = new ElevenLabsService();
