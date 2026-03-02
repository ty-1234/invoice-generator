import { IInvoice } from '../models/Invoice';

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ');
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('en-US');
}

function buildContent(invoice: IInvoice): string {
  const client =
    typeof invoice.clientId === 'object' && invoice.clientId
      ? (invoice.clientId as unknown as { name?: string; email?: string })
      : null;

  const lines: string[] = [
    `Invoice ${invoice.number}`,
    `Status: ${invoice.status.toUpperCase()}`,
    '',
    `Issue Date: ${formatDate(invoice.issueDate)}`,
    `Due Date: ${formatDate(invoice.dueDate)}`,
    `Currency: ${invoice.currency}`,
    '',
    `Bill To: ${client?.name || 'N/A'}`,
    `Email: ${client?.email || 'N/A'}`,
    '',
    'Line Items',
    'Description | Qty | Unit Price | Total',
  ];

  invoice.lineItems.slice(0, 25).forEach((item) => {
    lines.push(
      `${item.description} | ${item.quantity} | ${formatMoney(item.unitPrice)} | ${formatMoney(item.total)}`
    );
  });

  if (invoice.lineItems.length > 25) {
    lines.push(`... ${invoice.lineItems.length - 25} more item(s) omitted`);
  }

  lines.push('');
  lines.push(`Subtotal: ${invoice.currency} ${formatMoney(invoice.subtotal)}`);
  lines.push(`Tax: ${invoice.currency} ${formatMoney(invoice.tax)}`);
  lines.push(`Total: ${invoice.currency} ${formatMoney(invoice.total)}`);

  if (invoice.notes) {
    lines.push('');
    lines.push(`Notes: ${invoice.notes}`);
  }

  if (invoice.terms) {
    lines.push('');
    lines.push(`Terms: ${invoice.terms}`);
  }

  const streamLines: string[] = ['BT', '/F1 11 Tf'];
  let y = 800;

  for (const line of lines) {
    if (y < 50) {
      break;
    }
    streamLines.push(`1 0 0 1 40 ${y} Tm (${escapePdfText(line)}) Tj`);
    y -= 16;
  }

  streamLines.push('ET');
  return streamLines.join('\n');
}

function buildPdfDocument(content: string): Buffer {
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  objects.forEach((obj, idx) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

export function generateInvoicePdf(invoice: IInvoice): Buffer {
  const content = buildContent(invoice);
  return buildPdfDocument(content);
}
