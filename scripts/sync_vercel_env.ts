import { spawnSync } from 'child_process';
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
  const val = process.env[key];
  if (val && val.trim()) {
    console.log(`Adding ${key} to Vercel...`);
    const res = spawnSync(
      'vercel',
      [
        'env',
        'add',
        key,
        'production,preview,development',
        '--scope',
        'pxpickkyyys-projects',
        '--force',
        '--yes',
        '--value',
        val.trim(),
      ],
      { encoding: 'utf8', shell: true }
    );

    if (res.status === 0) {
      console.log(`✅ Successfully added ${key}`);
    } else {
      console.error(`❌ Error adding ${key}:`, res.stderr || res.stdout);
    }
  }
}
