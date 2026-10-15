import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { InvoiceData } from '../schemas/contracts.js';

/**
 * Clean compliant invoice fixture 1 (USDC SME Cloud Bill)
 */
export const CLEAN_INVOICE_AWS: InvoiceData = {
  invoiceNumber: 'INV-2026-901',
  vendorName: 'AWS Cloud Infrastructure Corp',
  recipientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  amount: 2500,
  currency: 'USDC',
  dueDate: '2026-10-30',
};

/**
 * Clean compliant invoice fixture 2 (AVAX Infrastructure Provider)
 */
export const CLEAN_INVOICE_NODE_OPS: InvoiceData = {
  invoiceNumber: 'INV-2026-902',
  vendorName: 'Avalanche Validator Ops',
  recipientAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  amount: 150,
  currency: 'AVAX',
  dueDate: '2026-11-05',
};

/**
 * Sanctioned test invoice 1: OFAC-blacklisted EVM address (Tornado Cash Router)
 */
export const SANCTIONED_INVOICE_OFAC_ADDRESS: InvoiceData = {
  invoiceNumber: 'INV-OFAC-001',
  vendorName: 'Decentralized Privacy Services',
  recipientAddress: '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b',
  amount: 5000,
  currency: 'USDC',
  dueDate: '2026-10-25',
};

/**
 * Sanctioned test invoice 2: OFAC-designated vendor entity (Garantex Europe OU)
 */
export const SANCTIONED_INVOICE_OFAC_VENDOR: InvoiceData = {
  invoiceNumber: 'INV-OFAC-002',
  vendorName: 'Garantex Europe OU',
  recipientAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  amount: 10000,
  currency: 'USDC',
  dueDate: '2026-10-28',
};

/**
 * Formats a clean commercial invoice text template for parsing tests
 */
export function generateInvoiceText(inv: InvoiceData): string {
  return `
============================================================
COMMERCIAL INVOICE
============================================================
Vendor: ${inv.vendorName}
Invoice No: ${inv.invoiceNumber}
Issue Date: 2026-10-15
Due Date: ${inv.dueDate}

Payable Remittance:
Recipient Wallet: ${inv.recipientAddress}
Network: Avalanche C-Chain (Fuji Testnet)

Line Items:
1. Enterprise Cloud GPU Compute Allocation      $${inv.amount.toFixed(2)}

------------------------------------------------------------
Total Amount Due: $${inv.amount.toFixed(2)} ${inv.currency}
============================================================
  `.trim();
}

/**
 * Generates a valid standard PDF buffer using pdf-lib
 */
export async function generateMinimalPdfBuffer(inv: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 500]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const lines = [
    `Vendor: ${inv.vendorName}`,
    `Invoice No: ${inv.invoiceNumber}`,
    `Issue Date: 2026-10-15`,
    `Due Date: ${inv.dueDate}`,
    `Recipient Wallet: ${inv.recipientAddress}`,
    `Total Amount Due: $${inv.amount.toFixed(2)} ${inv.currency}`,
  ];

  page.drawText(lines.join('\n'), {
    x: 50,
    y: 420,
    size: 13,
    font,
    color: rgb(0, 0, 0),
    lineHeight: 22,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
