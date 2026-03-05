import { IInvoice } from '../models/Invoice';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN = 40;

type Rgb = [number, number, number];
type FontKey = 'F1' | 'F2';

interface DrawTextOptions {
  font?: FontKey;
  size?: number;
  color?: Rgb;
  align?: 'left' | 'right' | 'center';
  width?: number;
}

const HELVETICA_WIDTHS: Record<string, number> = {
  ' ': 278,
  '!': 278,
  '"': 355,
  '#': 556,
  '$': 556,
  '%': 889,
  '&': 667,
  "'": 191,
  '(': 333,
  ')': 333,
  '*': 389,
  '+': 584,
  ',': 278,
  '-': 333,
  '.': 278,
  '/': 278,
  '0': 556,
  '1': 556,
  '2': 556,
  '3': 556,
  '4': 556,
  '5': 556,
  '6': 556,
  '7': 556,
  '8': 556,
  '9': 556,
  ':': 278,
  ';': 278,
  '<': 584,
  '=': 584,
  '>': 584,
  '?': 556,
  '@': 1015,
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  '[': 278,
  '\\': 278,
  ']': 278,
  '^': 469,
  _: 556,
  '`': 333,
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
  '{': 334,
  '|': 260,
  '}': 334,
  '~': 584,
};

const HELVETICA_BOLD_WIDTHS: Record<string, number> = {
  ' ': 278,
  '!': 333,
  '"': 474,
  '#': 556,
  '$': 556,
  '%': 889,
  '&': 722,
  "'": 238,
  '(': 333,
  ')': 333,
  '*': 389,
  '+': 584,
  ',': 278,
  '-': 333,
  '.': 278,
  '/': 278,
  '0': 556,
  '1': 556,
  '2': 556,
  '3': 556,
  '4': 556,
  '5': 556,
  '6': 556,
  '7': 556,
  '8': 556,
  '9': 556,
  ':': 333,
  ';': 333,
  '<': 584,
  '=': 584,
  '>': 584,
  '?': 611,
  '@': 975,
  A: 722,
  B: 722,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 556,
  K: 722,
  L: 611,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  '[': 333,
  '\\': 278,
  ']': 333,
  '^': 584,
  _: 556,
  '`': 333,
  a: 556,
  b: 611,
  c: 556,
  d: 611,
  e: 556,
  f: 333,
  g: 611,
  h: 611,
  i: 278,
  j: 278,
  k: 556,
  l: 278,
  m: 889,
  n: 611,
  o: 611,
  p: 611,
  q: 611,
  r: 389,
  s: 556,
  t: 333,
  u: 611,
  v: 556,
  w: 778,
  x: 556,
  y: 556,
  z: 500,
  '{': 389,
  '|': 280,
  '}': 389,
  '~': 584,
};

function escapePdfText(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ');
}

function colorToPdf(color: Rgb): string {
  return color.map((c) => (Math.max(0, Math.min(255, c)) / 255).toFixed(3)).join(' ');
}

function estimateTextWidth(value: string, fontSize: number, font: FontKey): number {
  const fontWidths = font === 'F2' ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS;
  const fallbackWidth = font === 'F2' ? 560 : 520;
  let total = 0;

  for (const ch of value) {
    total += fontWidths[ch] ?? fallbackWidth;
  }

  return (total / 1000) * fontSize;
}

function fitText(value: string, maxWidth: number, fontSize: number, font: FontKey): string {
  if (maxWidth <= 0) return '';
  if (estimateTextWidth(value, fontSize, font) <= maxWidth) return value;

  const suffix = '...';
  let output = value;
  while (output.length > 0 && estimateTextWidth(`${output}${suffix}`, fontSize, font) > maxWidth) {
    output = output.slice(0, -1);
  }

  return output ? `${output}${suffix}` : suffix;
}

function wrapText(value: string, maxChars: number): string[] {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return [];

  const words = cleaned.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const originalWord of words) {
    let word = originalWord;
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = '';
      }

      while (word.length > maxChars) {
        lines.push(`${word.slice(0, Math.max(1, maxChars - 1))}-`);
        word = word.slice(Math.max(1, maxChars - 1));
      }

      current = word;
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = '';
    }

    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function truncateLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) return lines;
  const out = lines.slice(0, Math.max(1, maxLines));
  const last = out[out.length - 1];
  out[out.length - 1] = last.endsWith('...') ? last : `${last.slice(0, Math.max(1, last.length - 3))}...`;
  return out;
}

function toPdfY(topY: number): number {
  return PAGE_HEIGHT - topY;
}

function drawRect(
  commands: string[],
  x: number,
  topY: number,
  width: number,
  height: number,
  fillColor?: Rgb,
  strokeColor?: Rgb
): void {
  const rectY = PAGE_HEIGHT - topY - height;

  if (fillColor && strokeColor) {
    commands.push(`${colorToPdf(fillColor)} rg`);
    commands.push(`${colorToPdf(strokeColor)} RG`);
    commands.push(`${x.toFixed(2)} ${rectY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re B`);
    return;
  }

  if (fillColor) {
    commands.push(`${colorToPdf(fillColor)} rg`);
    commands.push(`${x.toFixed(2)} ${rectY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
    return;
  }

  if (strokeColor) {
    commands.push(`${colorToPdf(strokeColor)} RG`);
    commands.push(`${x.toFixed(2)} ${rectY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
  }
}

function drawLine(
  commands: string[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeColor: Rgb,
  lineWidth = 1
): void {
  commands.push(`${lineWidth.toFixed(2)} w`);
  commands.push(`${colorToPdf(strokeColor)} RG`);
  commands.push(`${x1.toFixed(2)} ${toPdfY(y1).toFixed(2)} m ${x2.toFixed(2)} ${toPdfY(y2).toFixed(2)} l S`);
}

function drawText(
  commands: string[],
  value: string,
  x: number,
  y: number,
  options: DrawTextOptions = {}
): void {
  const text = value.trim();
  if (!text) return;

  const font = options.font ?? 'F1';
  const size = options.size ?? 10;
  const color = options.color ?? [15, 23, 42];
  const width = options.width ?? 0;

  let content = text;
  if (width > 0) {
    content = fitText(content, width, size, font);
  }

  let drawX = x;
  const textWidth = estimateTextWidth(content, size, font);
  if (options.align === 'right' && width > 0) {
    drawX = x + width - textWidth;
  } else if (options.align === 'center' && width > 0) {
    drawX = x + (width - textWidth) / 2;
  }

  commands.push('BT');
  commands.push(`/${font} ${size} Tf`);
  commands.push(`${colorToPdf(color)} rg`);
  commands.push(`1 0 0 1 ${drawX.toFixed(2)} ${toPdfY(y).toFixed(2)} Tm`);
  commands.push(`(${escapePdfText(content)}) Tj`);
  commands.push('ET');
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function buildContent(invoice: IInvoice): string {
  const client =
    typeof invoice.clientId === 'object' && invoice.clientId
      ? (invoice.clientId as unknown as {
          name?: string;
          email?: string;
          phone?: string;
          billingAddress?: string;
        })
      : null;

  const c = {
    primary: [37, 99, 235] as Rgb,
    slate900: [15, 23, 42] as Rgb,
    slate700: [51, 65, 85] as Rgb,
    slate500: [100, 116, 139] as Rgb,
    slate300: [203, 213, 225] as Rgb,
    slate200: [226, 232, 240] as Rgb,
    slate100: [241, 245, 249] as Rgb,
    green: [22, 163, 74] as Rgb,
    amber: [217, 119, 6] as Rgb,
    red: [220, 38, 38] as Rgb,
  };

  const streamLines: string[] = [];
  const contentWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  const right = PAGE_WIDTH - PAGE_MARGIN;

  const status = invoice.status.toUpperCase();
  const statusColor: Rgb =
    invoice.status === 'paid'
      ? c.green
      : invoice.status === 'overdue' || invoice.status === 'cancelled'
        ? c.red
        : invoice.status === 'sent'
          ? c.primary
          : c.amber;

  const headerTop = 34;
  drawRect(streamLines, PAGE_MARGIN, headerTop, contentWidth, 86, [248, 250, 252], c.slate200);
  drawRect(streamLines, PAGE_MARGIN, headerTop, contentWidth, 5, c.primary);

  drawText(streamLines, 'Invoice Generator', PAGE_MARGIN + 18, headerTop + 28, {
    font: 'F2',
    size: 17,
    color: c.slate900,
  });
  drawText(streamLines, 'For Freelancers', PAGE_MARGIN + 18, headerTop + 45, {
    size: 10,
    color: c.slate500,
  });

  drawText(streamLines, 'INVOICE', PAGE_MARGIN + 310, headerTop + 28, {
    font: 'F2',
    size: 22,
    color: c.slate900,
    align: 'right',
    width: 230,
  });
  drawText(streamLines, invoice.number, PAGE_MARGIN + 310, headerTop + 48, {
    size: 10,
    color: c.slate700,
    align: 'right',
    width: 230,
  });

  const badgeWidth = Math.max(70, estimateTextWidth(status, 9, 'F2') + 16);
  const badgeX = right - 18 - badgeWidth;
  drawRect(streamLines, badgeX, headerTop + 58, badgeWidth, 18, [240, 249, 255], statusColor);
  drawText(streamLines, status, badgeX + 8, headerTop + 70, {
    font: 'F2',
    size: 9,
    color: statusColor,
    width: badgeWidth - 16,
    align: 'center',
  });

  const infoTop = headerTop + 104;
  const leftBoxW = 310;
  const rightBoxW = contentWidth - leftBoxW - 14;

  const billToLines = truncateLines(
    [
      client?.email || '',
      client?.phone || '',
      ...(client?.billingAddress ? wrapText(client.billingAddress, 42) : []),
    ].filter(Boolean),
    4
  );

  const metaRows: Array<[string, string]> = [
    ['Issue Date', formatDate(invoice.issueDate)],
    ['Due Date', formatDate(invoice.dueDate)],
    ['Currency', invoice.currency],
    ['Amount Due', `${invoice.currency} ${formatMoney(invoice.total)}`],
  ];

  const billToHeaderY = infoTop + 20;
  const billToNameY = infoTop + 38;
  const billToLinesStartY = infoTop + 57;
  const billToHeight = 74 + Math.max(1, billToLines.length) * 14;

  const metaTopOffset = 22;
  const metaRowGap = 21;
  const metaHeight = metaTopOffset + (metaRows.length - 1) * metaRowGap + 18;

  const infoBoxHeight = Math.max(96, billToHeight, metaHeight);

  drawRect(streamLines, PAGE_MARGIN, infoTop, leftBoxW, infoBoxHeight, [255, 255, 255], c.slate200);
  drawRect(
    streamLines,
    PAGE_MARGIN + leftBoxW + 14,
    infoTop,
    rightBoxW,
    infoBoxHeight,
    [255, 255, 255],
    c.slate200
  );

  drawText(streamLines, 'Bill To', PAGE_MARGIN + 12, billToHeaderY, {
    font: 'F2',
    size: 10,
    color: c.slate500,
  });
  drawText(streamLines, client?.name || 'N/A', PAGE_MARGIN + 12, billToNameY, {
    font: 'F2',
    size: 11,
    color: c.slate900,
    width: leftBoxW - 24,
  });

  billToLines.forEach((line, index) => {
    drawText(streamLines, line, PAGE_MARGIN + 12, billToLinesStartY + index * 14, {
      size: 10,
      color: c.slate700,
      width: leftBoxW - 24,
    });
  });

  const metaLeft = PAGE_MARGIN + leftBoxW + 26;
  const metaLabelWidth = 70;
  const metaValueX = metaLeft + metaLabelWidth;
  const metaValueWidth = rightBoxW - metaLabelWidth - 24;

  metaRows.forEach(([label, value], index) => {
    const y = infoTop + metaTopOffset + index * metaRowGap;
    drawText(streamLines, label, metaLeft, y, {
      size: 10,
      color: c.slate500,
    });
    drawText(streamLines, value, metaValueX, y, {
      font: index === metaRows.length - 1 ? 'F2' : 'F1',
      size: 10,
      color: c.slate900,
      width: metaValueWidth,
    });
  });

  const tableTop = infoTop + infoBoxHeight + 14;
  const headerHeight = 24;
  const rowHeight = 24;
  const maxRows = 12;
  const visibleRows = invoice.lineItems.slice(0, maxRows);
  const hiddenRows = Math.max(0, invoice.lineItems.length - maxRows);
  const tableHeight = headerHeight + visibleRows.length * rowHeight;

  // Keep all columns strictly inside the table width.
  const colBoundary1 = PAGE_MARGIN + 300;
  const colBoundary2 = PAGE_MARGIN + 355;
  const colBoundary3 = PAGE_MARGIN + 435;

  const colX = {
    description: PAGE_MARGIN + 12,
    qty: colBoundary1 + 8,
    unit: colBoundary2 + 8,
    total: colBoundary3 + 8,
  };
  const colW = {
    description: colBoundary1 - PAGE_MARGIN - 24,
    qty: colBoundary2 - colBoundary1 - 16,
    unit: colBoundary3 - colBoundary2 - 16,
    total: right - colBoundary3 - 16,
  };

  drawRect(streamLines, PAGE_MARGIN, tableTop, contentWidth, tableHeight, [255, 255, 255], c.slate200);
  drawRect(streamLines, PAGE_MARGIN, tableTop, contentWidth, headerHeight, c.slate100, c.slate200);

  drawLine(streamLines, colBoundary1, tableTop, colBoundary1, tableTop + tableHeight, c.slate200);
  drawLine(streamLines, colBoundary2, tableTop, colBoundary2, tableTop + tableHeight, c.slate200);
  drawLine(streamLines, colBoundary3, tableTop, colBoundary3, tableTop + tableHeight, c.slate200);

  drawText(streamLines, 'Description', colX.description, tableTop + 16, {
    font: 'F2',
    size: 10,
    color: c.slate700,
  });
  drawText(streamLines, 'Qty', colX.qty, tableTop + 16, {
    font: 'F2',
    size: 10,
    color: c.slate700,
    align: 'right',
    width: colW.qty,
  });
  drawText(streamLines, 'Unit Price', colX.unit, tableTop + 16, {
    font: 'F2',
    size: 10,
    color: c.slate700,
    align: 'right',
    width: colW.unit,
  });
  drawText(streamLines, 'Total', colX.total, tableTop + 16, {
    font: 'F2',
    size: 10,
    color: c.slate700,
    align: 'right',
    width: colW.total,
  });

  visibleRows.forEach((item, index) => {
    const rowTop = tableTop + headerHeight + index * rowHeight;
    if (index > 0) {
      drawLine(streamLines, PAGE_MARGIN, rowTop, right, rowTop, c.slate200);
    }

    drawText(streamLines, item.description, colX.description, rowTop + 16, {
      size: 10,
      color: c.slate900,
      width: colW.description,
    });
    drawText(streamLines, `${item.quantity}`, colX.qty, rowTop + 16, {
      size: 10,
      color: c.slate900,
      align: 'right',
      width: colW.qty,
    });
    drawText(streamLines, formatMoney(item.unitPrice), colX.unit, rowTop + 16, {
      size: 10,
      color: c.slate900,
      align: 'right',
      width: colW.unit,
    });
    drawText(streamLines, formatMoney(item.total), colX.total, rowTop + 16, {
      size: 10,
      color: c.slate900,
      align: 'right',
      width: colW.total,
    });
  });

  let sectionTop = tableTop + tableHeight + 14;
  if (hiddenRows > 0) {
    drawText(streamLines, `+ ${hiddenRows} more line item(s) not shown on this page`, PAGE_MARGIN, sectionTop + 12, {
      size: 9,
      color: c.slate500,
    });
    sectionTop += 18;
  }

  const totalsBoxW = 220;
  const totalsX = right - totalsBoxW;
  const totalsH = 82;
  drawRect(streamLines, totalsX, sectionTop, totalsBoxW, totalsH, [248, 250, 252], c.slate200);

  const totalsRows: Array<[string, string, boolean]> = [
    ['Subtotal', `${invoice.currency} ${formatMoney(invoice.subtotal)}`, false],
    ['Tax', `${invoice.currency} ${formatMoney(invoice.tax)}`, false],
    ['Total', `${invoice.currency} ${formatMoney(invoice.total)}`, true],
  ];

  totalsRows.forEach(([label, value, emph], index) => {
    const y = sectionTop + 20 + index * 22;
    drawText(streamLines, label, totalsX + 12, y, {
      size: emph ? 11 : 10,
      font: emph ? 'F2' : 'F1',
      color: c.slate700,
    });
    drawText(streamLines, value, totalsX + 12, y, {
      size: emph ? 11 : 10,
      font: emph ? 'F2' : 'F1',
      color: c.slate900,
      align: 'right',
      width: totalsBoxW - 24,
    });
  });

  let detailsTop = sectionTop + totalsH + 10;
  const detailsWidth = contentWidth;

  if (invoice.notes) {
    const notesLines = truncateLines(wrapText(invoice.notes, 94), 5);
    const boxHeight = 24 + notesLines.length * 14;
    drawRect(streamLines, PAGE_MARGIN, detailsTop, detailsWidth, boxHeight, [255, 255, 255], c.slate200);
    drawText(streamLines, 'Notes', PAGE_MARGIN + 12, detailsTop + 18, {
      font: 'F2',
      size: 10,
      color: c.slate500,
    });
    notesLines.forEach((line, index) => {
      drawText(streamLines, line, PAGE_MARGIN + 12, detailsTop + 35 + index * 14, {
        size: 10,
        color: c.slate700,
        width: detailsWidth - 24,
      });
    });
    detailsTop += boxHeight + 10;
  }

  if (invoice.terms) {
    const termsLines = truncateLines(wrapText(invoice.terms, 94), 4);
    const boxHeight = 24 + termsLines.length * 14;
    drawRect(streamLines, PAGE_MARGIN, detailsTop, detailsWidth, boxHeight, [255, 255, 255], c.slate200);
    drawText(streamLines, 'Terms', PAGE_MARGIN + 12, detailsTop + 18, {
      font: 'F2',
      size: 10,
      color: c.slate500,
    });
    termsLines.forEach((line, index) => {
      drawText(streamLines, line, PAGE_MARGIN + 12, detailsTop + 35 + index * 14, {
        size: 10,
        color: c.slate700,
        width: detailsWidth - 24,
      });
    });
  }

  return streamLines.join('\n');
}

function buildPdfDocument(content: string): Buffer {
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
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
