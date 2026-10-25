import React, { useState, useEffect } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Coins,
  QrCode,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { sound } from '../../lib/sound';
import type { PaymentMethod } from '../../types';

interface PaymentModalProps {
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const {
    cartTotals,
    selectedCustomer,
    completeSale,
    currentStore,
    currentShift,
  } = usePOS();

  const totalAmount = cartTotals.total;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(totalAmount);
  const [cashInputValue, setCashInputValue] = useState<string>(totalAmount.toString());
  const [bonusToSpend, setBonusToSpend] = useState<number>(0);
  const [splitCardAmount, setSplitCardAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalStep, setTerminalStep] = useState<'idle' | 'waiting' | 'success'>('idle');

  // Sync cash input with tendered
  useEffect(() => {
    setCashInputValue(cashTendered.toString());
  }, [cashTendered]);

  // Adjust bonus spending
  const availableBonus = selectedCustomer?.bonusPoints || 0;
  const maxBonusUsable = Math.min(availableBonus, totalAmount);

  // If method changes to CARD or QR, tendered equals total
  useEffect(() => {
    if (paymentMethod === 'CARD' || paymentMethod === 'QR') {
      setCashTendered(totalAmount);
      setBonusToSpend(0);
    } else if (paymentMethod === 'MIXED') {
      const half = Math.floor(totalAmount / 2);
      setCashTendered(half);
      setSplitCardAmount(totalAmount - half);
    } else if (paymentMethod === 'BONUSES') {
      const usable = Math.min(availableBonus, totalAmount);
      setBonusToSpend(usable);
      setCashTendered(Math.max(0, totalAmount - usable));
    } else {
      setCashTendered(totalAmount);
    }
  }, [paymentMethod, totalAmount, availableBonus]);

  // Quick bills helper
  const addCashBill = (bill: number) => {
    sound.playKeypadClick();
    setCashTendered((prev) => prev + bill);
  };

  const handleCashInputChange = (val: string) => {
    setCashInputValue(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setCashTendered(parsed);
    }
  };

  // Change amount
  const effectivePaid =
    paymentMethod === 'CASH'
      ? cashTendered
      : paymentMethod === 'MIXED'
      ? cashTendered + splitCardAmount
      : paymentMethod === 'BONUSES'
      ? cashTendered + bonusToSpend
      : totalAmount;

  const changeDue = Math.max(0, effectivePaid - totalAmount);
  const isSufficient = effectivePaid >= totalAmount;

  const handleCompletePayment = async () => {
    if (!isSufficient && paymentMethod === 'CASH') return;
    setIsProcessing(true);

    try {
      if (paymentMethod === 'CARD' || paymentMethod === 'QR') {
        setTerminalStep('waiting');
        sound.playScanBeep();
        await new Promise((r) => setTimeout(r, 800));
        setTerminalStep('success');
      }

      if (paymentMethod === 'MIXED') {
        await completeSale(
          'MIXED',
          effectivePaid,
          0,
          [
            { method: 'CASH', amount: cashTendered },
            { method: 'CARD', amount: splitCardAmount, referenceCode: `TERM-${Math.floor(100000 + Math.random() * 900000)}` },
          ],
          notes
        );
      } else if (paymentMethod === 'BONUSES') {
        await completeSale(
          bonusToSpend >= totalAmount ? 'BONUSES' : 'MIXED',
          effectivePaid,
          bonusToSpend,
          [
            { method: 'BONUSES', amount: bonusToSpend },
            { method: 'CASH', amount: cashTendered },
          ],
          notes
        );
      } else {
        await completeSale(paymentMethod, cashTendered, 0, undefined, notes);
      }

      onClose();
    } catch (err) {
      sound.playErrorBuzzer();
      setIsProcessing(false);
      setTerminalStep('idle');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
              ₽
            </div>
            <div>
              <h3 className="font-bold text-sm">Оплата заказа</h3>
              <span className="text-[11px] text-slate-400">
                Позиций: {cartTotals.itemsCount} • {currentStore?.name}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount to pay banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Итого к оплате:</span>
            <div className="text-3xl font-black tracking-tight mt-0.5">
              {totalAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
            </div>
          </div>
          {cartTotals.totalDiscount > 0 && (
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-right">
              <span className="text-[10px] text-blue-200 uppercase font-medium">Ваша скидка:</span>
              <div className="text-xs font-bold text-emerald-300">
                -{cartTotals.totalDiscount.toFixed(2)} ₽
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Payment Method Selector Grid */}
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('CASH');
                sound.playKeypadClick();
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 font-bold scale-102'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-[11px]">Наличные</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('CARD');
                sound.playKeypadClick();
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                paymentMethod === 'CARD'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 font-bold scale-102'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-[11px]">Карта</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('MIXED');
                sound.playKeypadClick();
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                paymentMethod === 'MIXED'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 font-bold scale-102'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[11px]">Смешанная</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('BONUSES');
                sound.playKeypadClick();
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                paymentMethod === 'BONUSES'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30 font-bold scale-102'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Coins className="w-5 h-5" />
              <span className="text-[11px]">Бонусы</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('QR');
                sound.playKeypadClick();
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                paymentMethod === 'QR'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30 font-bold scale-102'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-[11px]">СБП / QR</span>
            </button>
          </div>

          {/* Conditional Sub-panels */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Внесено покупателем:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCashTendered(totalAmount);
                    sound.playKeypadClick();
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Без сдачи (Ровно {totalAmount.toFixed(0)} ₽)
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={cashInputValue}
                  onChange={(e) => handleCashInputChange(e.target.value)}
                  className="w-full text-2xl font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ₽
                </span>
              </div>

              {/* Quick banknote pills */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => addCashBill(bill)}
                    className="py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
                  >
                    +{bill} ₽
                  </button>
                ))}
              </div>

              {/* Change indicator */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                isSufficient
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <span>{isSufficient ? 'Сдача покупателю:' : 'Недостаточно внесено:'}</span>
                <span className="text-base font-black">
                  {isSufficient ? `${changeDue.toFixed(2)} ₽` : `${(totalAmount - effectivePaid).toFixed(2)} ₽`}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Оплата через банковский терминал</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Приложите банковскую карту, телефон с Mir Pay или вставьте чип
                </p>
              </div>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                {totalAmount.toFixed(2)} ₽
              </div>
            </div>
          )}

          {paymentMethod === 'MIXED' && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Сумма наличными:
                </label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => {
                    const c = parseFloat(e.target.value) || 0;
                    setCashTendered(c);
                    setSplitCardAmount(Math.max(0, totalAmount - c));
                  }}
                  className="w-full text-base font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Сумма по карте:
                </label>
                <input
                  type="number"
                  value={splitCardAmount}
                  onChange={(e) => {
                    const card = parseFloat(e.target.value) || 0;
                    setSplitCardAmount(card);
                    setCashTendered(Math.max(0, totalAmount - card));
                  }}
                  className="w-full text-base font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Итого распределено:</span>
                <span className={cashTendered + splitCardAmount >= totalAmount ? 'text-emerald-600' : 'text-rose-600'}>
                  {(cashTendered + splitCardAmount).toFixed(2)} / {totalAmount.toFixed(2)} ₽
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'BONUSES' && (
            <div className="space-y-3 p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  {selectedCustomer ? `Клиент: ${selectedCustomer.name}` : 'Клиент не привязан к чеку'}
                </span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  Доступно: {availableBonus} баллов
                </span>
              </div>

              {availableBonus > 0 ? (
                <>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Списать баллов (1 балл = 1 рубль):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max={maxBonusUsable}
                        value={bonusToSpend}
                        onChange={(e) => {
                          const val = Math.min(maxBonusUsable, Math.max(0, parseFloat(e.target.value) || 0));
                          setBonusToSpend(val);
                          setCashTendered(Math.max(0, totalAmount - val));
                        }}
                        className="flex-1 text-base font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBonusToSpend(maxBonusUsable);
                          setCashTendered(Math.max(0, totalAmount - maxBonusUsable));
                        }}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs"
                      >
                        Списать всё
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 pt-1 border-t border-amber-200 dark:border-amber-800">
                    <span>Доплата наличными / картой:</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {(totalAmount - bonusToSpend).toFixed(2)} ₽
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-slate-500">
                  У выбранного покупателя нет накопленных бонусов. Выберите клиента с бонусной картой в чеке.
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'QR' && (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center space-y-3">
              <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-sm mx-auto flex items-center justify-center border">
                {/* Visual mock QR code for SBP */}
                <div className="w-full h-full bg-slate-900 rounded-lg p-2 flex flex-col items-center justify-center text-white">
                  <QrCode className="w-16 h-16 text-emerald-400" />
                  <span className="text-[10px] font-bold mt-1 text-emerald-300">СБП Оплата</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Покупатель сканирует динамический QR-код через мобильное приложение банка
              </p>
            </div>
          )}

          {/* Comment / Note */}
          <div>
            <input
              type="text"
              placeholder="Комментарий к чеку (необязательно)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
            />
          </div>

        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            Отмена
          </button>

          <button
            type="button"
            disabled={!isSufficient && paymentMethod === 'CASH'}
            onClick={handleCompletePayment}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              isSufficient || paymentMethod !== 'CASH'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <span>Обработка платежа...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Завершить оплату и напечатать чек (F4)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
