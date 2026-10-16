import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const keysToSync = [
  'OPENROUTER_API_KEY',
  'OPENROUTER_MODEL',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'AVALANCHE_RPC_URL',
  'AVALANCHE_CHAIN_ID',
  'USDC_FUJI_ADDRESS',
  'SNOWTRACE_BASE_URL',
];

for (const key of keysToSync) {
  const raw = process.env[key];
  if (raw && raw.trim()) {
    const cleaned = raw.replace(/^["']|["']$/g, '').trim();
    console.log(`Syncing ${key} (clean length: ${cleaned.length})...`);
    try {
      execSync(
        `vercel env add ${key} production,preview,development --scope pxpickkyyys-projects --force -y`,
        {
          input: cleaned,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );
      console.log(`✅ Successfully added ${key}`);
    } catch (err: any) {
      console.error(`❌ Error adding ${key}:`, err.stderr || err.message);
    }
  }
}
