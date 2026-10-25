import React, { useState } from 'react';
import { X, Percent, Tag, Check, Sparkles } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { sound } from '../../lib/sound';

interface DiscountModalProps {
  onClose: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ onClose }) => {
  const { orderDiscountPercent, setOrderDiscountPercent, cartTotals } = usePOS();
  const [selectedPercent, setSelectedPercent] = useState<number>(orderDiscountPercent);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const PRESETS = [3, 5, 10, 15, 20, 25];

  const handleApply = (percent: number) => {
    setOrderDiscountPercent(percent);
    sound.playKeypadClick();
    onClose();
  };

  const handlePromoCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'VIP10' || code === 'SALE10') {
      setSelectedPercent(10);
      setOrderDiscountPercent(10);
      setPromoMessage({ text: 'Промокод применен: Скидка 10%!', ok: true });
      sound.playScanBeep();
    } else if (code === 'SUPER20' || code === 'VIP20') {
      setSelectedPercent(20);
      setOrderDiscountPercent(20);
      setPromoMessage({ text: 'Промокод применен: Скидка 20%!', ok: true });
      sound.playScanBeep();
    } else {
      setPromoMessage({ text: 'Промокод не найден или истек', ok: false });
      sound.playErrorBuzzer();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-sm">Скидка на чек</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Быстрый процент скидки:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPercent(p)}
                  className={`py-3 rounded-xl border text-sm font-black transition-all ${
                    selectedPercent === p
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Или введите произвольный процент (0 - 50%):
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="50"
                value={selectedPercent}
                onChange={(e) => setSelectedPercent(Math.min(50, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-full text-xl font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">
                %
              </span>
            </div>
          </div>

          {/* Promo code form */}
          <form onSubmit={handlePromoCheck} className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Промокод / Купон:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Например: SALE10 или VIP20"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full text-xs uppercase font-mono tracking-wider bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Применить
              </button>
            </div>
            {promoMessage && (
              <p className={`text-[11px] mt-1.5 font-medium ${promoMessage.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                {promoMessage.text}
              </p>
            )}
          </form>

          {/* Summary preview */}
          {selectedPercent > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                Скидка на чек ({selectedPercent}%):
              </span>
              <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                -{((cartTotals.subtotal * selectedPercent) / 100).toFixed(2)} ₽
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleApply(0)}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Сбросить скидку
            </button>
            <button
              type="button"
              onClick={() => handleApply(selectedPercent)}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Сохранить скидку
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
