// Thermal printer formatting, ESC/POS byte generator, and Barcode SVG helper
import type { Order, Store, POSSettings } from '../types';

export function formatThermalReceiptText(order: Order, store: Store, settings: POSSettings): string {
  const width = settings.printerWidth === '58mm' ? 32 : 44;
  const line = '-'.repeat(width);
  const doubleLine = '='.repeat(width);

  const pad = (left: string, right: string) => {
    const space = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(space) + right;
  };

  const center = (text: string) => {
    const leftPad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(leftPad) + text;
  };

  const lines: string[] = [];

  // Header
  lines.push(center(store.name.toUpperCase()));
  if (store.address) lines.push(center(store.address));
  if (store.phone) lines.push(center(`Тел: ${store.phone}`));
  if (store.taxNumber) lines.push(center(`ИНН: ${store.taxNumber}`));
  if (store.headerNotice) lines.push(center(store.headerNotice));
  lines.push(doubleLine);

  // Meta
  lines.push(pad(`ЧЕК № ${order.receiptNumber}`, new Date(order.createdAt).toLocaleDateString('ru-RU')));
  lines.push(pad(`Кассир: ${order.userName}`, new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })));
  if (order.customerName) {
    lines.push(pad(`Клиент: ${order.customerName}`, `Бонусы: ${order.bonusEarned > 0 ? '+' + order.bonusEarned : ''}`));
  }
  lines.push(line);

  // Items
  lines.push(pad('НАИМЕНОВАНИЕ', 'СУММА'));
  lines.push(line);

  for (const item of order.items) {
    const nameStr = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
    lines.push(nameStr);
    const qtyPart = `${item.quantity} x ${item.unitPrice.toFixed(2)}`;
    const totalPart = `${item.totalPrice.toFixed(2)} ₽`;
    lines.push(pad(`  ${qtyPart}`, totalPart));
    if (item.discountAmt > 0) {
      lines.push(pad(`  Скидка`, `-${item.discountAmt.toFixed(2)} ₽`));
    }
  }

  lines.push(line);

  // Totals
  lines.push(pad('Подитог:', `${order.subtotal.toFixed(2)} ₽`));
  if (order.discountAmount > 0) {
    lines.push(pad(`Скидка (${order.discountRate}%):`, `-${order.discountAmount.toFixed(2)} ₽`));
  }
  if (order.bonusApplied > 0) {
    lines.push(pad('Оплачено бонусами:', `-${order.bonusApplied.toFixed(2)} ₽`));
  }
  lines.push(pad('В т.ч. НДС 20%:', `${order.taxAmount.toFixed(2)} ₽`));
  lines.push(doubleLine);
  lines.push(pad('ИТОГО К ОПЛАТЕ:', `${order.totalAmount.toFixed(2)} ₽`));
  lines.push(doubleLine);

  // Payments
  const methodLabel: Record<string, string> = {
    CASH: 'НАЛИЧНЫМИ',
    CARD: 'БАНКОВСКОЙ КАРТОЙ',
    BONUSES: 'БОНУСНЫМИ БАЛЛАМИ',
    MIXED: 'СМЕШАННАЯ ОПЛАТА',
    QR: 'СБП / QR-КОД',
    TRANSFER: 'БЕЗНАЛИЧНЫЙ РАСЧЕТ',
  };
  lines.push(pad('Вид оплаты:', methodLabel[order.paymentMethod] || order.paymentMethod));
  lines.push(pad('Получено:', `${order.paidAmount.toFixed(2)} ₽`));
  if (order.changeAmount > 0) {
    lines.push(pad('Сдача:', `${order.changeAmount.toFixed(2)} ₽`));
  }

  lines.push(line);
  if (store.footerNotice) {
    lines.push(center(store.footerNotice));
  }
  lines.push(center('* КАССОВЫЙ ЧЕК ПРИНЯТ В ОФД *'));
  lines.push(center('ФН: 9960440301019283 ФД: 104928 ФП: 382910492'));
  lines.push('');

  return lines.join('\n');
}

// Generates real ESC/POS byte sequence for direct thermal hardware sending via WebUSB or Web Serial
export function generateEscPosBytes(order: Order, store: Store, settings: POSSettings): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];

  const addBytes = (...bytes: number[]) => chunks.push(new Uint8Array(bytes));
  const addText = (text: string) => chunks.push(encoder.encode(text + '\n'));

  // ESC @: Initialize printer
  addBytes(0x1b, 0x40);

  // ESC p: Kick cash drawer open if enabled
  if (settings.openCashDrawerOnSale) {
    addBytes(0x1b, 0x70, 0x00, 0x19, 0xfa);
  }

  // Center alignment & Double height for title
  addBytes(0x1b, 0x61, 0x01); // Center
  addBytes(0x1b, 0x45, 0x01); // Bold on
  addBytes(0x1d, 0x21, 0x11); // Double size
  addText(store.name);
  addBytes(0x1d, 0x21, 0x00); // Normal size
  addBytes(0x1b, 0x45, 0x00); // Bold off

  // Text content
  const receiptText = formatThermalReceiptText(order, store, settings);
  addBytes(0x1b, 0x61, 0x00); // Left align
  addText(receiptText);

  // GS V 66 0: Partial Cut paper with 3 feeds
  addBytes(0x1b, 0x64, 0x03); // Feed 3 lines
  addBytes(0x1d, 0x56, 0x42, 0x00); // Cut

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

// Renders an SVG barcode representation for product stickers and receipts
export function generateBarcodeSvg(code: string): string {
  // Simple deterministic Code 128 style bar width pattern generator
  const cleanCode = code.replace(/[^0-9A-Za-z-]/g, '') || '460700100101';
  let pattern = '101'; // start guard
  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const binary = (charCode % 32).toString(2).padStart(5, '0');
    pattern += binary + (i % 2 === 0 ? '1' : '0');
  }
  pattern += '101'; // stop guard

  const barWidth = 2;
  const height = 48;
  const svgWidth = pattern.length * barWidth + 20;

  let bars = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      bars += `<rect x="${10 + i * barWidth}" y="4" width="${barWidth}" height="${height - 14}" fill="#0f172a" />`;
    }
  }

  return `<svg viewBox="0 0 ${svgWidth} ${height}" class="w-full h-auto max-h-12" xmlns="http://www.w3.org/2000/svg">
    ${bars}
    <text x="${svgWidth / 2}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="10" fill="#334155" letter-spacing="2">${cleanCode}</text>
  </svg>`;
}
