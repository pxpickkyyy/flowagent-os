import { pdfParserService } from '../src/services/pdfParserService.js';
import { settlementService } from '../src/services/settlementService.js';
import { complianceService } from '../src/services/complianceService.js';

async function runEdgeCases() {
  console.log('--- Edge Case 1: Ingestion with multiple addresses (Contract address preceding Remit To) ---');
  const invoiceText = `
INVOICE #INV-2026-777
Date: 2026-10-15
Token Contract: 0x5425890298aed601595a70ab815c96711a31bc65
Vendor: DataFlow Cloud Systems

Item: High Performance Computing
Total Amount Due: $4,500.00 USDC

Remit To Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
`;
  const result = pdfParserService.extractRegexHeuristics(invoiceText);
  console.log('Recipient Address Extracted:', result.recipientAddress);
  console.log('Amount:', result.amount);
  console.log('Invoice #:', result.invoiceNumber);
  console.log('Vendor:', result.vendorName);
  if (result.recipientAddress !== '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') {
    throw new Error('FAILED: Extracted contract address instead of remit-to address!');
  }
  console.log('✅ Edge Case 1 Passed!');

  console.log('\n--- Edge Case 2: Smart Contract vs EOA code verification ---');
  // USDC contract address is a contract
  const contractCheck = await complianceService.checkReceiverCode('0x5425890298aed601595a70ab815c96711a31bc65');
  console.log('USDC Contract check:', contractCheck);
  if (!contractCheck.isContract || contractCheck.accountType !== 'CONTRACT') {
    throw new Error('FAILED: Expected USDC address to be detected as CONTRACT');
  }

  // Account #0 is an EOA
  const eoaCheck = await complianceService.checkReceiverCode('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  console.log('Account #0 EOA check:', eoaCheck);
  if (eoaCheck.isContract || eoaCheck.accountType !== 'EOA') {
    throw new Error('FAILED: Expected Account #0 to be detected as EOA');
  }
  console.log('✅ Edge Case 2 Passed!');

  console.log('\n--- Edge Case 3: Zero-crash USDC balance guard & formatting ---');
  const res = await settlementService.executeUsdcBatchSettlement('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 2500);
  console.log('Settlement res message:', res.message);
  console.log('Settlement status:', res.status);
  console.log('✅ Edge Case 3 Passed!');
}

runEdgeCases().catch((err) => {
  console.error('❌ Edge case verification failed:', err);
  process.exit(1);
});
