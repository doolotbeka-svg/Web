import React, { useState } from 'react';
import {
  X,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { sound } from '../../lib/sound';

interface ShiftModalProps {
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ onClose }) => {
  const {
    currentShift,
    currentStore,
    currentUser,
    openShift,
    closeShift,
    cashDrawerInOut,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'status' | 'cash-op' | 'close'>('status');
  const [openingFloat, setOpeningFloat] = useState<string>('5000');
  const [closingCash, setClosingCash] = useState<string>('');
  const [cashOpType, setCashOpType] = useState<'IN' | 'OUT'>('IN');
  const [cashOpAmount, setCashOpAmount] = useState<string>('');
  const [cashOpReason, setCashOpReason] = useState<string>('');
  const [xReportPrinted, setXReportPrinted] = useState(false);

  // Computed expected cash in drawer
  const expectedCashInDrawer = currentShift
    ? currentShift.openingCash +
      currentShift.totalSalesCash +
      currentShift.cashDrawerIn -
      currentShift.cashDrawerOut -
      currentShift.returnsTotal
    : 0;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatVal = parseFloat(openingFloat) || 0;
    await openShift(floatVal, 'Смена открыта кассиром');
    onClose();
  };

  const handleCashOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cashOpAmount);
    if (!amount || amount <= 0) return;
    await cashDrawerInOut(cashOpType, amount, cashOpReason || (cashOpType === 'IN' ? 'Внесение разменной монеты' : 'Инкассация'));
    setCashOpAmount('');
    setCashOpReason('');
    setActiveTab('status');
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCash = parseFloat(closingCash);
    const actualCash = isNaN(parsedCash) ? expectedCashInDrawer : parsedCash;
    await closeShift(actualCash, `Фактическая сумма: ${actualCash} ₽ (Расчетная: ${expectedCashInDrawer} ₽)`);
    onClose();
  };

  const handlePrintXReport = () => {
    sound.playScanBeep();
    setXReportPrinted(true);
    setTimeout(() => setXReportPrinted(false), 3000);
    // In a physical environment this sends ESC/POS command to thermal printer
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Кассовая смена</h2>
              <span className="text-xs text-slate-400">
                {currentStore?.name} • {currentUser?.name}
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

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* If Shift is CLOSED: Show Open Shift Form */}
          {!currentShift ? (
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-bold mb-1">Смена в данный момент закрыта</p>
                  <p>Для начала регистрации продаж откройте новую смену и укажите разменный фонд в кассе.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Сумма разменного фонда (наличные в ящике):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    required
                    className="w-full text-xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    {currentStore?.currency || 'RUB'}
                  </span>
                </div>
              </div>

              {/* Quick bill selectors for float */}
              <div className="flex gap-2">
                {[1000, 3000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setOpeningFloat(amt.toString())}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Открыть кассовую смену</span>
              </button>
            </form>
          ) : (
            <>
              {/* Tabs: Status / Cash In-Out / Close Shift */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'status'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Показатели
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cash-op')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'cash-op'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Внесение / Выемка
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('close');
                    setClosingCash(expectedCashInDrawer.toString());
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'close'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  }`}
                >
                  Закрыть (Z-отчёт)
                </button>
              </div>

              {/* Tab 1: Current Shift Status & KPIs */}
              {activeTab === 'status' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[11px] font-medium text-slate-500 uppercase">Выручка за смену</span>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                        {currentShift.totalSales.toLocaleString('ru-RU')} ₽
                      </p>
                      <span className="text-[10px] text-slate-400">Чек: {currentShift.ordersCount} шт</span>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase">Наличных в ящике</span>
                      <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {expectedCashInDrawer.toLocaleString('ru-RU')} ₽
                      </p>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80">Расчетный остаток</span>
                    </div>
                  </div>

                  {/* Detailed breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Начальный разменный фонд:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{currentShift.openingCash} ₽</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Продажи (Наличные):</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{currentShift.totalSalesCash} ₽</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Продажи (Банковские карты):</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">+{currentShift.totalSalesCard} ₽</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Списано бонусов:</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{currentShift.totalSalesBonus} баллов</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Внесения денег:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">+{currentShift.cashDrawerIn} ₽</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Инкассации / Выемки:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">-{currentShift.cashDrawerOut} ₽</span>
                    </div>
                    {currentShift.returnsCount > 0 && (
                      <div className="flex justify-between text-rose-600 dark:text-rose-400">
                        <span>Возвраты ({currentShift.returnsCount} шт):</span>
                        <span className="font-semibold">-{currentShift.returnsTotal} ₽</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Print X-Report */}
                  <div className="pt-2">
                    <button
                      onClick={handlePrintXReport}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-blue-400" />
                      <span>{xReportPrinted ? 'X-отчёт распечатан на ленте ✓' : 'Напечатать промежуточный X-отчёт (без гашения)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Cash In / Out */}
              {activeTab === 'cash-op' && (
                <form onSubmit={handleCashOperation} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCashOpType('IN')}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                        cashOpType === 'IN'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                      <span>Внесение денег</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCashOpType('OUT')}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                        cashOpType === 'OUT'
                          ? 'bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4 text-rose-500" />
                      <span>Инкассация / Выемка</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Сумма ({currentStore?.currency || 'RUB'}):
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={cashOpAmount}
                      onChange={(e) => setCashOpAmount(e.target.value)}
                      required
                      className="w-full text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Основание / Причина:
                    </label>
                    <input
                      type="text"
                      placeholder="Например: Размен монет или Инкассация в банк"
                      value={cashOpReason}
                      onChange={(e) => setCashOpReason(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                  >
                    Подтвердить операцию
                  </button>
                </form>
              )}

              {/* Tab 3: Close Shift (Z-Report) */}
              {activeTab === 'close' && (
                <form onSubmit={handleCloseShift} className="space-y-4">
                  <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                    <p className="font-bold mb-1">Внимание! Закрытие кассовой смены с гашением (Z-отчёт)</p>
                    <p>После закрытия смены кассовые счетчики сбрасываются. Посчитайте фактическую наличность в денежном ящике.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Расчетная сумма в кассе:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{expectedCashInDrawer} ₽</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Фактическая наличность при пересчете:
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={closingCash}
                        onChange={(e) => setClosingCash(e.target.value)}
                        required
                        className="w-full text-xl font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Variance check */}
                    {closingCash && (
                      <div className="text-xs flex items-center justify-between font-semibold p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <span>Расхождение (излишек / недостача):</span>
                        <span className={parseFloat(closingCash) - expectedCashInDrawer < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {(parseFloat(closingCash) - expectedCashInDrawer).toFixed(2)} ₽
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Закрыть смену и напечатать Z-отчёт</span>
                  </button>
                </form>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
