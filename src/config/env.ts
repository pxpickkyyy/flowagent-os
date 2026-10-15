import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Avalanche Fuji
  AVALANCHE_RPC_URL: z.string().url().default('https://api.avax-test.network/ext/bc/C/rpc'),
  AVALANCHE_PRIVATE_KEY: z.string().optional(),
  AVALANCHE_DEFAULT_RECIPIENT: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address')
    .default('0x000000000000000000000000000000000000dEaD'),

  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'), // Rachel
  ELEVENLABS_MODEL_ID: z.string().default('eleven_multilingual_v2'),

  // U-Bot Webhook
  UBOT_WEBHOOK_SECRET: z.string().default('ubot_dev_secret_token_12345'),
  UBOT_OUTBOUND_WEBHOOK_URL: z.string().url().optional().default('http://localhost:3000/api/webhook/ubot/mock-receiver'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Configuration error - Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration');
}

export const ENV = parsedEnv.data;
