import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.js';

export interface TTSResult {
  success: boolean;
  audioBuffer?: Buffer;
  outputPath?: string;
  bytesCount?: number;
  error?: string;
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
   * Synthesize speech using ElevenLabs API
   */
  async synthesizeSpeech(
    text: string,
    options?: {
      voiceId?: string;
      modelId?: string;
      saveToFile?: boolean;
      filename?: string;
    }
  ): Promise<TTSResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'ELEVENLABS_API_KEY is not configured. Add ELEVENLABS_API_KEY to your .env file.',
      };
    }

    try {
      const voice = options?.voiceId || ENV.ELEVENLABS_VOICE_ID;
      const model = options?.modelId || ENV.ELEVENLABS_MODEL_ID;

      const audioStream = await this.client.textToSpeech.convert(voice, {
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
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
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
    const response = await this.client.voices.getAll();
    return response.voices;
  }
}

export const elevenlabsService = new ElevenLabsService();
