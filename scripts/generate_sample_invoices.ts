import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  CLEAN_INVOICE_AWS,
  CLEAN_INVOICE_NODE_OPS,
  SANCTIONED_INVOICE_OFAC_ADDRESS,
} from '../src/test/mockInvoices.js';

async function createInvoicePdf(
  invoice: {
    invoiceNumber: string;
    vendorName: string;
    recipientAddress: string;
    amount: number;
    currency: string;
    dueDate: string;
  },
  title: string,
  isSanctioned: boolean = false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Background / Border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: 535,
    height: 782,
    borderWidth: 1.5,
    borderColor: isSanctioned ? rgb(0.85, 0.1, 0.2) : rgb(0.1, 0.5, 0.8),
    color: rgb(0.98, 0.98, 0.99),
  });

  // Header Banner
  page.drawRectangle({
    x: 30,
    y: 730,
    width: 535,
    height: 82,
    color: isSanctioned ? rgb(0.85, 0.15, 0.2) : rgb(0.08, 0.15, 0.3),
  });

  page.drawText(title.toUpperCase(), {
    x: 50,
    y: 765,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(isSanctioned ? '[OFAC SANCTIONS TEST DOCKET]' : '[COMPLIANT COMMERCIAL INVOICE]', {
    x: 50,
    y: 745,
    size: 10,
    font: fontBold,
    color: isSanctioned ? rgb(1, 0.9, 0.9) : rgb(0.3, 0.85, 0.6),
  });

  // Invoice Details Grid
  let y = 690;
  const drawRow = (label: string, value: string, isHighlight: boolean = false) => {
    page.drawText(label, { x: 55, y, size: 10, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
    page.drawText(value, {
      x: 180,
      y,
      size: 11,
      font: isHighlight ? fontBold : fontRegular,
      color: isHighlight ? (isSanctioned ? rgb(0.85, 0.1, 0.2) : rgb(0.08, 0.6, 0.4)) : rgb(0.1, 0.15, 0.2),
    });
    y -= 26;
  };

  drawRow('Invoice Number:', invoice.invoiceNumber);
  drawRow('Vendor:', invoice.vendorName, true);
  drawRow('Issue Date:', '2026-10-16');
  drawRow('Due Date:', invoice.dueDate);
  drawRow('Payment Rail:', 'Avalanche Fuji C-Chain (Chain ID: 43113)');
  drawRow('Recipient EVM Wallet:', invoice.recipientAddress, true);

  y -= 15;
  // Divider
  page.drawLine({
    start: { x: 50, y },
    end: { x: 540, y },
    thickness: 1,
    color: rgb(0.8, 0.85, 0.9),
  });
  y -= 30;

  // Line item table header
  page.drawRectangle({
    x: 50,
    y: y - 5,
    width: 490,
    height: 24,
    color: rgb(0.92, 0.94, 0.96),
  });
  page.drawText('DESCRIPTION', { x: 60, y: y + 2, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  page.drawText('QTY', { x: 340, y: y + 2, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  page.drawText('AMOUNT', { x: 450, y: y + 2, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  y -= 32;

  // Line item
  const desc = isSanctioned
    ? 'Decentralized Privacy Mixer Relay Quota'
    : invoice.currency === 'AVAX'
    ? 'Subnet Validator Fleet Dedicated Hosting'
    : 'Enterprise Cloud GPU & Storage Compute';

  page.drawText(desc, { x: 60, y, size: 10, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });
  page.drawText('1.0', { x: 345, y, size: 10, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });
  page.drawText(`${invoice.amount.toLocaleString()} ${invoice.currency}`, {
    x: 430,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  y -= 50;
  // Total Box
  page.drawRectangle({
    x: 320,
    y: y - 10,
    width: 220,
    height: 40,
    color: isSanctioned ? rgb(0.98, 0.92, 0.93) : rgb(0.93, 0.98, 0.95),
    borderColor: isSanctioned ? rgb(0.85, 0.15, 0.2) : rgb(0.2, 0.7, 0.4),
    borderWidth: 1,
  });

  page.drawText('TOTAL DUE:', { x: 335, y: y + 8, size: 10, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  page.drawText(`$${invoice.amount.toLocaleString()} ${invoice.currency}`, {
    x: 415,
    y: y + 6,
    size: 13,
    font: fontBold,
    color: isSanctioned ? rgb(0.85, 0.1, 0.2) : rgb(0.08, 0.6, 0.4),
  });

  y -= 80;
  // Notice footer
  const notice = isSanctioned
    ? 'COMPLIANCE NOTICE: This address matches the OFAC SDN Sanctions List (Tornado Cash Router). FlowAgent OS deterministic guard will permanently halt broadcast.'
    : 'SETTLEMENT NOTICE: FlowAgent OS settles this invoice on Avalanche Fuji C-Chain in < 2.0s with sub-cent gas fees via Circle USDC / AVAX.';

  page.drawText(notice, {
    x: 55,
    y,
    size: 8.5,
    font: fontRegular,
    color: isSanctioned ? rgb(0.75, 0.1, 0.15) : rgb(0.4, 0.45, 0.5),
    maxWidth: 480,
    lineHeight: 12,
  });

  return await pdfDoc.save();
}

async function main() {
  const dirs = [
    path.resolve(process.cwd(), 'frontend', 'public', 'samples'),
    path.resolve(process.cwd(), 'public', 'samples'),
  ];

  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  const files = [
    {
      name: 'sample-aws-clean-invoice.pdf',
      data: CLEAN_INVOICE_AWS,
      title: 'Amazon Web Services Invoice',
      isSanctioned: false,
    },
    {
      name: 'sample-tornado-sanctioned-invoice.pdf',
      data: SANCTIONED_INVOICE_OFAC_ADDRESS,
      title: 'Tornado Cash Mixer Invoice',
      isSanctioned: true,
    },
    {
      name: 'sample-nodeops-validator-invoice.pdf',
      data: CLEAN_INVOICE_NODE_OPS,
      title: 'Avalanche Validator Ops Invoice',
      isSanctioned: false,
    },
  ];

  for (const file of files) {
    const bytes = await createInvoicePdf(file.data, file.title, file.isSanctioned);
    for (const d of dirs) {
      const targetPath = path.join(d, file.name);
      fs.writeFileSync(targetPath, bytes);
      console.log(`✅ Generated ${targetPath} (${bytes.length} bytes)`);
    }
  }
}

main().catch(console.error);
