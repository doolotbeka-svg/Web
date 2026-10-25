import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  RotateCcw,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  Banknote,
  Coins,
  QrCode,
  Layers,
  FileText,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { ReceiptModal } from '../pos/ReceiptModal';
import { sound } from '../../lib/sound';
import type { Order, PaymentMethod } from '../../types';

export const SalesView: React.FC = () => {
  const { orders, currentStore, refundOrder } = usePOS();

  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedOrderForPreview, setSelectedOrderForPreview] = useState<Order | null>(null);
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('Не подошел товар / брак');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.receiptNumber.toLowerCase().includes(q) ||
        o.userName.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q));

      const matchesMethod = filterMethod === 'ALL' || o.paymentMethod === filterMethod;
      const matchesStatus = filterStatus === 'ALL' || o.status === filterStatus;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [orders, search, filterMethod, filterStatus]);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingOrder) return;
    await refundOrder(refundingOrder.id, refundReason);
    setRefundingOrder(null);
  };

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
            <Banknote className="w-3 h-3" />
            <span>Наличные</span>
          </span>
        );
      case 'CARD':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
            <CreditCard className="w-3 h-3" />
            <span>Карта</span>
          </span>
        );
      case 'BONUSES':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
            <Coins className="w-3 h-3" />
            <span>Бонусы</span>
          </span>
        );
      case 'MIXED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
            <Layers className="w-3 h-3" />
            <span>Смешанная</span>
          </span>
        );
      case 'QR':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
            <QrCode className="w-3 h-3" />
            <span>СБП / QR</span>
          </span>
        );
      default:
        return <span className="text-[11px] font-mono">{method}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Top Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск чека по номеру, кассиру, покупателю или товару..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Все типы оплаты</option>
            <option value="CASH">Наличные</option>
            <option value="CARD">Карта</option>
            <option value="BONUSES">Бонусы</option>
            <option value="MIXED">Смешанная</option>
            <option value="QR">СБП / QR</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Все статусы</option>
            <option value="COMPLETED">Оплачен</option>
            <option value="REFUNDED">Возвращен</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Найдено чеков: <span className="font-bold text-slate-900 dark:text-white">{filteredOrders.length}</span>
        </div>

      </div>

      {/* Orders Table */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Чек №</th>
                  <th className="py-3 px-3">Дата и время</th>
                  <th className="py-3 px-3">Кассир</th>
                  <th className="py-3 px-3">Покупатель</th>
                  <th className="py-3 px-3">Позиций</th>
                  <th className="py-3 px-3">Оплата</th>
                  <th className="py-3 px-3 text-right">Сумма</th>
                  <th className="py-3 px-3 text-center">Статус</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Чеки не найдены
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const isRefunded = ord.status === 'REFUNDED';

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        
                        {/* Receipt Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          #{ord.receiptNumber}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                          <div>{new Date(ord.createdAt).toLocaleDateString('ru-RU')}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Cashier */}
                        <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {ord.userName}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                          {ord.customerName ? (
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white">{ord.customerName}</span>
                              {ord.bonusEarned > 0 && (
                                <div className="text-[10px] text-emerald-600">+{ord.bonusEarned} бонусов</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Items count */}
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                          {ord.items.length} поз.
                        </td>

                        {/* Payment method */}
                        <td className="py-3.5 px-3">
                          {getMethodBadge(ord.paymentMethod)}
                        </td>

                        {/* Total amount */}
                        <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-white text-sm">
                          {ord.totalAmount.toFixed(2)} ₽
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          {isRefunded ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 px-2 py-0.5 rounded-md">
                              <XCircle className="w-3 h-3" />
                              <span>Возврат</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                              <CheckCircle className="w-3 h-3" />
                              <span>Оплачен</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View & Re-print receipt */}
                            <button
                              onClick={() => {
                                setSelectedOrderForPreview(ord);
                                sound.playKeypadClick();
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                              title="Просмотр и печать чека"
                            >
                              <Printer className="w-4 h-4 text-blue-500" />
                            </button>

                            {/* Return / Refund */}
                            {!isRefunded && (
                              <button
                                onClick={() => {
                                  setRefundingOrder(ord);
                                  sound.playKeypadClick();
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title="Оформить возврат чека"
                              >
                                <RotateCcw className="w-4 h-4 text-rose-500" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Re-print receipt modal */}
      {selectedOrderForPreview && (
        <ReceiptModal
          order={selectedOrderForPreview}
          onClose={() => setSelectedOrderForPreview(null)}
        />
      )}

      {/* Refund Confirmation Modal */}
      {refundingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form
            onSubmit={handleRefundSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <RotateCcw className="w-5 h-5" />
              <h4 className="font-bold text-sm">Оформление возврата по чеку</h4>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Чек № {refundingOrder.receiptNumber}</span>
                <span>{refundingOrder.totalAmount.toFixed(2)} ₽</span>
              </div>
              <div className="text-slate-500">
                Кассир: {refundingOrder.userName} • {new Date(refundingOrder.createdAt).toLocaleDateString('ru-RU')}
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Все товары из чека будут автоматически возвращены на склад в текущую торговую точку.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Причина возврата:
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                <option value="Не подошел размер / цвет">Не подошел размер / цвет</option>
                <option value="Брак / дефект товара">Брак / дефект товара</option>
                <option value="Отказ покупателя">Отказ покупателя</option>
                <option value="Ошибочный пробитый чек">Ошибочный пробитый чек кассира</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundingOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Подтвердить возврат
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
