import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Avalanche Fuji (Chain ID: 43113)
  AVALANCHE_RPC_URL: z.string().url().default('http://127.0.0.1:8545'),
  AVALANCHE_FUJI_RPC_URL: z.string().url().optional().default('http://127.0.0.1:8545'),
  AVALANCHE_CHAIN_ID: z.coerce.number().default(43113),
  AVALANCHE_USDC_CONTRACT: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address')
    .default('0x5425890298aed601595a70ab815c96711a31bc65'),
  USDC_FUJI_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address')
    .default('0x5425890298aed601595a70ab815c96711a31bc65'),
  SNOWTRACE_BASE_URL: z.string().url().default('https://testnet.snowtrace.io'),
  AVALANCHE_PRIVATE_KEY: z.string().optional(),
  AVALANCHE_DEFAULT_RECIPIENT: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address')
    .default('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'),
  AVAX_PRICE_USD: z.coerce.number().default(25.0),

  // Gemini API
  GEMINI_API_KEY: z.string().optional(),

  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'), // Rachel
  ELEVENLABS_MODEL_ID: z.string().default('eleven_turbo_v2_5'),

  // Tokenomist API (Token Unlock, Vesting & Tokenomics Data)
  TOKENOMIST_API_KEY: z.string().optional(),
  TOKENOMIST_API_URL: z.string().url().default('https://api.tokenomist.ai/v4'),

  // OpenRouter / DeepSeek AI
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('deepseek/deepseek-v4.1-flash'),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),

  // U-Bot Webhook
  UBOT_WEBHOOK_SECRET: z.string().default('ubot_dev_secret_token_12345'),
  UBOT_OUTBOUND_WEBHOOK_URL: z.string().url().optional().default('http://localhost:3000/api/webhook/ubot/mock-receiver'),

  // Emergency Stage Fallback Protocol
  ENABLE_DEMO_FALLBACK: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val.toLowerCase() === 'true' || val === '1';
    })
    .default(false),
  AVALANCHE_FALLBACK_RPCS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Configuration error - Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration');
}

export const ENV = parsedEnv.data;
