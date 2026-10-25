import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Banknote,
  Users,
  Award,
  Download,
  Calendar,
  Percent,
  Receipt,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { sound } from '../../lib/sound';

export const ReportsView: React.FC = () => {
  const { orders, currentStore } = usePOS();
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('all');

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const oneDay = 86400000;

    return orders.filter((o) => {
      if (o.status === 'REFUNDED') return false; // don't count refunded orders in net revenue

      const diff = now - o.createdAt;
      if (period === 'today') return diff <= oneDay;
      if (period === 'yesterday') return diff > oneDay && diff <= oneDay * 2;
      if (period === 'week') return diff <= oneDay * 7;
      if (period === 'month') return diff <= oneDay * 30;
      return true;
    });
  }, [orders, period]);

  // Overall Financial KPIs
  const metrics = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let totalDiscount = 0;
    let count = filteredOrders.length;

    filteredOrders.forEach((o) => {
      revenue += o.totalAmount;
      totalDiscount += o.discountAmount;
      o.items.forEach((it) => {
        cost += it.costPrice * it.quantity;
      });
    });

    const profit = Math.max(0, revenue - cost);
    const avgCheck = count > 0 ? revenue / count : 0;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue,
      profit,
      cost,
      totalDiscount,
      count,
      avgCheck,
      margin,
    };
  }, [filteredOrders]);

  // Payment methods breakdown
  const paymentMethodStats = useMemo(() => {
    const map: Record<string, { count: number; total: number; label: string }> = {
      CASH: { count: 0, total: 0, label: 'Наличные' },
      CARD: { count: 0, total: 0, label: 'Банковские карты' },
      BONUSES: { count: 0, total: 0, label: 'Бонусные баллы' },
      MIXED: { count: 0, total: 0, label: 'Смешанная' },
      QR: { count: 0, total: 0, label: 'СБП / QR-код' },
    };

    filteredOrders.forEach((o) => {
      if (!map[o.paymentMethod]) {
        map[o.paymentMethod] = { count: 0, total: 0, label: o.paymentMethod };
      }
      map[o.paymentMethod].count += 1;
      map[o.paymentMethod].total += o.totalAmount;
    });

    return Object.entries(map).map(([key, data]) => ({
      key,
      ...data,
      percent: metrics.revenue > 0 ? (data.total / metrics.revenue) * 100 : 0,
    }));
  }, [filteredOrders, metrics.revenue]);

  // Top Products Ranking
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {};

    filteredOrders.forEach((o) => {
      o.items.forEach((it) => {
        if (!map[it.productId]) {
          map[it.productId] = { name: it.productName, qty: 0, revenue: 0, profit: 0 };
        }
        map[it.productId].qty += it.quantity;
        map[it.productId].revenue += it.totalPrice;
        map[it.productId].profit += it.totalPrice - it.costPrice * it.quantity;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredOrders]);

  // Cashiers Breakdown
  const cashierStats = useMemo(() => {
    const map: Record<string, { name: string; orders: number; revenue: number }> = {};

    filteredOrders.forEach((o) => {
      if (!map[o.userId]) {
        map[o.userId] = { name: o.userName, orders: 0, revenue: 0 };
      }
      map[o.userId].orders += 1;
      map[o.userId].revenue += o.totalAmount;
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Export Report to CSV
  const handleExportReport = () => {
    const rows = [
      ['Отчет по продажам OmniPOS', currentStore?.name || ''],
      ['Период:', period],
      ['Дата выгрузки:', new Date().toLocaleString('ru-RU')],
      [],
      ['Общая выручка (₽)', metrics.revenue.toFixed(2)],
      ['Чистая прибыль (₽)', metrics.profit.toFixed(2)],
      ['Маржинальность (%)', metrics.margin.toFixed(1)],
      ['Количество чеков', metrics.count],
      ['Средний чек (₽)', metrics.avgCheck.toFixed(2)],
      [],
      ['ТОП ТОВАРОВ', 'Количество', 'Выручка (₽)', 'Прибыль (₽)'],
      ...topProducts.map((p) => [`"${p.name}"`, p.qty, p.revenue.toFixed(2), p.profit.toFixed(2)]),
      [],
      ['КАССИРЫ', 'Чеков', 'Выручка (₽)', 'Средний чек (₽)'],
      ...cashierStats.map((c) => [`"${c.name}"`, c.orders, c.revenue.toFixed(2), (c.revenue / c.orders).toFixed(2)]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `report_pos_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sound.playScanBeep();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Top Controls */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'today', label: 'Сегодня' },
            { id: 'yesterday', label: 'Вчера' },
            { id: 'week', label: '7 дней' },
            { id: 'month', label: '30 дней' },
            { id: 'all', label: 'Всё время' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPeriod(item.id as typeof period);
                sound.playKeypadClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Export CSV button */}
        <button
          onClick={handleExportReport}
          className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-blue-500" />
          <span>Экспорт отчёта в Excel (CSV)</span>
        </button>

      </div>

      {/* Analytics Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Revenue */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span className="uppercase tracking-wider">Выручка</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-950 dark:text-white mt-1">
              {metrics.revenue.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {metrics.count} успешных продаж
            </div>
          </div>

          {/* Card 2: Profit */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span className="uppercase tracking-wider">Прибыль (Валовая)</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {metrics.profit.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Маржа: <span className="text-emerald-500 font-bold">{metrics.margin.toFixed(1)}%</span>
            </div>
          </div>

          {/* Card 3: Average Ticket */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span className="uppercase tracking-wider">Средний чек</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-950 dark:text-white mt-1">
              {metrics.avgCheck.toFixed(0)} ₽
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Скидок предоставлено: {metrics.totalDiscount.toFixed(0)} ₽
            </div>
          </div>

          {/* Card 4: Orders Count */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span className="uppercase tracking-wider">Чеков пробито</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-950 dark:text-white mt-1">
              {metrics.count} шт
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Точка: {currentStore?.name.split('«')[1]?.replace('»', '') || 'Все'}
            </div>
          </div>

        </div>

        {/* Charts & Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Top Selling Products (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Рейтинг лидеров продаж (Топ товаров)
                </h4>
              </div>
              <span className="text-xs text-slate-400">По объему выручки</span>
            </div>

            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  За выбранный период продаж не найдено
                </div>
              ) : (
                topProducts.map((p, idx) => {
                  const maxRevenue = topProducts[0]?.revenue || 1;
                  const barWidth = Math.max(5, (p.revenue / maxRevenue) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[280px]">
                          {idx + 1}. {p.name}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-400 text-[11px]">{p.qty} шт</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {p.revenue.toFixed(0)} ₽
                          </span>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment Methods Distribution (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Структура оплат
                </h4>
              </div>
            </div>

            <div className="space-y-3">
              {paymentMethodStats.map((item) => (
                <div key={item.key} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                    <span className="text-slate-900 dark:text-white">{item.total.toFixed(0)} ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.count} транзакций</span>
                    <span>{item.percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.key === 'CASH'
                          ? 'bg-emerald-500'
                          : item.key === 'CARD'
                          ? 'bg-blue-500'
                          : item.key === 'BONUSES'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Cashier Performance Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Эффективность кассиров
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Кассир</th>
                  <th className="py-2.5 px-3 text-right">Чеков</th>
                  <th className="py-2.5 px-3 text-right">Общая выручка</th>
                  <th className="py-2.5 px-3 text-right">Средний чек</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashierStats.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                      {c.orders}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      {c.revenue.toFixed(2)} ₽
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-medium">
                      {(c.revenue / c.orders).toFixed(2)} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
