import fs from 'fs';
import path from 'path';
import { avalancheService } from '../src/services/avalancheService.js';
import { resilientRpcProvider } from '../src/config/resilientRpc.js';
import { VERIFIED_FUJI_FALLBACK_TXS } from '../src/services/fallbackCache.js';
import {
  CLEAN_INVOICE_AWS,
  CLEAN_INVOICE_NODE_OPS,
  SANCTIONED_INVOICE_OFAC_ADDRESS,
  SANCTIONED_INVOICE_OFAC_VENDOR,
} from '../src/test/mockInvoices.js';

async function recordDemoFixtures() {
  console.log('📦 Generating offline demo fixtures for FlowAgent OS...');

  let networkStatus: any;
  try {
    networkStatus = await avalancheService.ping();
    console.log('✅ Captured live Avalanche Fuji network telemetry');
  } catch {
    networkStatus = {
      chainId: 43113,
      blockNumber: 59488250,
      gasPrice: '25.0 nAVAX',
      isFuji: true,
      rpcLatencyMs: 35,
    };
    console.log('ℹ️ Using pre-calibrated Fuji network telemetry fixture');
  }

  const fixtures = {
    recordedAt: new Date().toISOString(),
    network: networkStatus,
    activeRpc: resilientRpcProvider.getActiveEndpoint(),
    verifiedTransactions: VERIFIED_FUJI_FALLBACK_TXS,
    sampleInvoices: {
      aws: CLEAN_INVOICE_AWS,
      nodeOps: CLEAN_INVOICE_NODE_OPS,
      sanctionedAddress: SANCTIONED_INVOICE_OFAC_ADDRESS,
      sanctionedVendor: SANCTIONED_INVOICE_OFAC_VENDOR,
    },
    simulatedRoutes: {
      aws: {
        amountUSD: 2500,
        swiftFeeUSD: 112.5,
        web3FeeUSD: 2.54,
        netSavedUSD: 109.96,
        savingsPercent: 97.7,
        swiftDuration: '3-5 business days',
        web3Duration: '~2.0 seconds',
      },
    },
  };

  const fixturesDir = path.resolve(process.cwd(), 'src', 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  const outputPath = path.join(fixturesDir, 'demoFallbackFixtures.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(fixtures, (_key, val) => (typeof val === 'bigint' ? val.toString() : val), 2),
    'utf-8'
  );

  console.log(`🎉 Demo fixtures successfully written to: ${outputPath}`);
}

recordDemoFixtures().catch((err) => {
  console.error('Error generating demo fixtures:', err);
  process.exit(1);
});
