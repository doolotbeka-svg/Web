import React, { useState } from 'react';
import {
  X,
  Printer,
  Check,
  Share2,
  Download,
  Terminal,
  Send,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatThermalReceiptText, generateEscPosBytes, generateBarcodeSvg } from '../../lib/escpos';
import type { Order } from '../../types';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { currentStore, settings } = usePOS();
  const [copied, setCopied] = useState(false);
  const [showEscPosCode, setShowEscPosCode] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  if (!order || !currentStore) return null;

  const receiptPlainText = formatThermalReceiptText(order, currentStore, settings);
  const escPosBytes = generateEscPosBytes(order, currentStore, settings);
  const barcodeSvgHtml = generateBarcodeSvg(order.receiptNumber);

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(receiptPlainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Чек из магазина ${currentStore.name}\n№ ${order.receiptNumber}\nСумма: ${order.totalAmount} ₽\nСпасибо за покупку!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setSentNotice('Открыт WhatsApp');
    setTimeout(() => setSentNotice(null), 3000);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`Чек из ${currentStore.name}\n№ ${order.receiptNumber}\nИтого: ${order.totalAmount} ₽`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${text}`, '_blank');
    setSentNotice('Открыт Telegram');
    setTimeout(() => setSentNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sm">Чек № {order.receiptNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left is paper receipt, Right is control actions */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          
          {/* Printable & Visual Thermal Paper Tape */}
          <div className="md:col-span-7 flex justify-center">
            <div
              id="thermal-receipt-printable"
              className="bg-white text-slate-900 p-5 rounded-md shadow-lg border border-slate-200 font-mono text-[11px] leading-tight w-full max-w-[340px] select-text relative"
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {/* Paper zigzag jagged top decorative border */}
              <div className="text-center font-bold text-sm mb-1 uppercase tracking-wider text-slate-950">
                {currentStore.name}
              </div>
              {currentStore.address && <div className="text-center text-[10px] text-slate-600 mb-0.5">{currentStore.address}</div>}
              {currentStore.phone && <div className="text-center text-[10px] text-slate-600 mb-0.5">Тел: {currentStore.phone}</div>}
              {currentStore.taxNumber && <div className="text-center text-[10px] text-slate-600 mb-1">ИНН: {currentStore.taxNumber}</div>}
              
              <div className="border-b border-dashed border-slate-400 my-2" />

              <div className="flex justify-between text-[10px] text-slate-700">
                <span>ЧЕК № {order.receiptNumber}</span>
                <span>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-700 mb-1">
                <span>Кассир: {order.userName}</span>
                <span>{new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between text-[10px] text-slate-700 mb-1 bg-slate-50 p-1 rounded">
                  <span>Клиент: {order.customerName}</span>
                  <span>{order.bonusEarned > 0 ? `+${order.bonusEarned} бонусов` : ''}</span>
                </div>
              )}

              <div className="border-b border-slate-900 my-1.5" />

              {/* Items List */}
              <div className="space-y-1.5 py-1">
                {order.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-semibold text-slate-900 break-words">
                      {it.productName} {it.variantName ? `(${it.variantName})` : ''}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {it.quantity} × {it.unitPrice.toFixed(2)} ₽
                      </span>
                      <span className="font-bold text-slate-900">{it.totalPrice.toFixed(2)} ₽</span>
                    </div>
                    {it.discountAmt > 0 && (
                      <div className="flex justify-between text-[10px] text-emerald-700">
                        <span>Скидка позиции:</span>
                        <span>-{it.discountAmt.toFixed(2)} ₽</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-slate-400 my-2" />

              {/* Totals */}
              <div className="space-y-1 text-slate-700 text-[10px]">
                <div className="flex justify-between">
                  <span>Подитог:</span>
                  <span>{order.subtotal.toFixed(2)} ₽</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Скидка ({order.discountRate}%):</span>
                    <span>-{order.discountAmount.toFixed(2)} ₽</span>
                  </div>
                )}
                {order.bonusApplied > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Оплата бонусами:</span>
                    <span>-{order.bonusApplied.toFixed(2)} ₽</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>В т.ч. НДС 20%:</span>
                  <span>{order.taxAmount.toFixed(2)} ₽</span>
                </div>
              </div>

              <div className="border-b-2 border-slate-950 my-2" />

              <div className="flex justify-between items-baseline font-black text-sm text-slate-950">
                <span>ИТОГО К ОПЛАТЕ:</span>
                <span className="text-base">{order.totalAmount.toFixed(2)} ₽</span>
              </div>

              <div className="border-b-2 border-slate-950 my-2" />

              {/* Payment tender */}
              <div className="space-y-0.5 text-[10px] text-slate-700 mb-2">
                <div className="flex justify-between">
                  <span>Оплата:</span>
                  <span className="font-semibold uppercase">
                    {order.paymentMethod === 'CASH'
                      ? 'Наличные'
                      : order.paymentMethod === 'CARD'
                      ? 'Банковская карта'
                      : order.paymentMethod === 'BONUSES'
                      ? 'Бонусные баллы'
                      : order.paymentMethod === 'MIXED'
                      ? 'Смешанная'
                      : 'СБП / QR'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Получено:</span>
                  <span>{order.paidAmount.toFixed(2)} ₽</span>
                </div>
                {order.changeAmount > 0 && (
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Сдача:</span>
                    <span>{order.changeAmount.toFixed(2)} ₽</span>
                  </div>
                )}
              </div>

              {/* Barcode representation */}
              <div
                className="my-3 flex justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
              />

              {/* Fiscal footer */}
              <div className="text-center text-[9px] text-slate-500 space-y-0.5 pt-1 border-t border-dashed border-slate-300">
                <div>* КАССОВЫЙ ЧЕК ПРИНЯТ В ОФД *</div>
                <div>ФН: 9960440301019283 ФД: 104928 ФП: 382910492</div>
                <div className="font-bold pt-1">{currentStore.footerNotice || 'Спасибо за покупку!'}</div>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="md:col-span-5 space-y-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">Оплата принята</h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Чек зарегистрирован в базе</p>
              </div>
            </div>

            {/* Print button */}
            <button
              onClick={handleBrowserPrint}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Печать чека (Термопринтер)</span>
            </button>

            {/* ESC/POS Raw button */}
            <button
              onClick={() => setShowEscPosCode(!showEscPosCode)}
              className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-xs text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span>{showEscPosCode ? 'Скрыть ESC/POS байты' : 'ESC/POS & WebUSB / Serial'}</span>
            </button>

            {/* Electronic receipt delivery */}
            <div className="pt-1">
              <span className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Отправить электронный чек:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="py-2 px-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </button>
              </div>
              {sentNotice && (
                <p className="text-[11px] text-emerald-600 font-medium text-center mt-1 animate-fade-in">
                  {sentNotice}
                </p>
              )}
            </div>

            {/* Copy raw text */}
            <button
              onClick={handleCopyText}
              className="w-full py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано в буфер!' : 'Скопировать текст чека'}</span>
            </button>

            {/* Next customer / Close */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors mt-2"
            >
              Новый покупатель (Esc)
            </button>
          </div>

        </div>

        {/* ESC/POS Raw Bytes Modal Viewer */}
        {showEscPosCode && (
          <div className="p-4 bg-slate-950 text-slate-300 border-t border-slate-800 font-mono text-[10px] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white">Пакет ESC/POS ({escPosBytes.length} байт):</span>
              <span className="text-[10px] text-emerald-400 font-semibold">WebUSB / Serial Ready</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg max-h-24 overflow-y-auto break-all text-emerald-400 select-all">
              {Array.from(escPosBytes.slice(0, 160))
                .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ')}
              {escPosBytes.length > 160 ? ' ... [RAW ESC/POS STREAM]' : ''}
            </div>
            <p className="text-[10px] text-slate-500">
              Прямой бинарный поток команд: инициализация `1B 40`, открытие ящика `1B 70`, автоотрезчик `1D 56 42 00`.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
