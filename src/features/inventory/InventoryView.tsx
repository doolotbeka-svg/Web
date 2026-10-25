import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  ClipboardList,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Store as StoreIcon,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { sound } from '../../lib/sound';
import type { MovementType, StockMovement } from '../../types';

export const InventoryView: React.FC = () => {
  const {
    products,
    variants,
    inventory,
    stores,
    currentStore,
    currentUser,
    saveStockMovement,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'balances' | 'movements' | 'operation'>('balances');
  const [search, setSearch] = useState('');
  const [opType, setOpType] = useState<MovementType>('RECEIPT');
  const [opProductState, setOpProduct] = useState<string>('');
  const [opVariantState, setOpVariant] = useState<string>('');
  // Fall back to the first product/variant so the form works when the catalog was empty on mount
  const opProduct = products.some((p) => p.id === opProductState) ? opProductState : products[0]?.id || '';
  const opVariants = variants.filter((v) => v.productId === opProduct);
  const opVariant = opVariants.some((v) => v.id === opVariantState) ? opVariantState : opVariants[0]?.id || '';
  const [opQuantity, setOpQuantity] = useState<string>('10');
  const [opTargetStore, setOpTargetStore] = useState<string>(stores[1]?.id || '');
  const [opNotes, setOpNotes] = useState('');
  const [opRef, setOpRef] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // History log query
  const [movementsList, setMovementsList] = useState<StockMovement[]>([]);

  // Calculate stock table
  const inventoryRows = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.trim().toLowerCase();
        return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      })
      .map((p) => {
        const currentQty = inventory
          .filter((i) => i.productId === p.id && i.storeId === currentStore?.id)
          .reduce((acc, i) => acc + i.quantity, 0);

        const allStoresBreakdown = stores.map((s) => ({
          storeName: s.name.split('«')[1]?.replace('»', '') || s.name,
          storeId: s.id,
          qty: inventory
            .filter((i) => i.productId === p.id && i.storeId === s.id)
            .reduce((acc, i) => acc + i.quantity, 0),
        }));

        return {
          product: p,
          currentQty,
          allStoresBreakdown,
          totalQty: allStoresBreakdown.reduce((sum, b) => sum + b.qty, 0),
          isLow: currentQty <= p.minStockAlert,
        };
      });
  }, [products, inventory, stores, currentStore, search]);

  const handleExecuteOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !opProduct) return;

    const prod = products.find((p) => p.id === opProduct);
    if (!prod) return;

    const qty = parseFloat(opQuantity);
    if (isNaN(qty) || qty <= 0) return;

    const variant = prod.hasVariants ? opVariants.find((v) => v.id === opVariant) : undefined;
    await saveStockMovement({
      storeId: currentStore.id,
      productId: prod.id,
      productName: prod.name,
      variantId: variant?.id,
      variantName: variant?.name,
      type: opType,
      quantity: qty,
      targetStoreId: opType === 'TRANSFER_OUT' ? opTargetStore : undefined,
      reference: opRef || (opType === 'RECEIPT' ? 'ПРИХОД-ПОСТАВЩИК' : opType === 'TRANSFER_OUT' ? 'ПЕРЕМЕЩЕНИЕ-СКЛАД' : 'СПИСАНИЕ-АКТ'),
      notes: opNotes || 'Складская проводка',
    });

    sound.playScanBeep();
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2500);
    setOpQuantity('10');
    setOpNotes('');
    setOpRef('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Top Header & Tab switcher */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'balances'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Остатки по складам
          </button>
          <button
            onClick={() => setActiveTab('operation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'operation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
          >
            + Новая складская операция
          </button>
        </div>

        {/* Search */}
        {activeTab === 'balances' && (
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по остаткам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
        )}

      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        
        {/* TAB 1: Stock Balances across branches */}
        {activeTab === 'balances' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Товар</th>
                    <th className="py-3 px-3">Артикул</th>
                    <th className="py-3 px-3 text-right">Текущий склад ({currentStore?.name.split('«')[1]?.replace('»', '') || 'Тек.'})</th>
                    {stores.map((s) => (
                      <th key={s.id} className="py-3 px-3 text-right font-medium text-slate-400">
                        {s.name.split('«')[1]?.replace('»', '') || s.name}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">Всего в сети</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inventoryRows.map((row) => (
                    <tr key={row.product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <img
                          src={row.product.image || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=100&q=80'}
                          alt={row.product.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{row.product.name}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-500">{row.product.sku}</td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-black px-2 py-0.5 rounded-md text-xs ${
                            row.currentQty <= 0
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                              : row.isLow
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {row.currentQty} {row.product.unit}
                        </span>
                      </td>

                      {row.allStoresBreakdown.map((b) => (
                        <td key={b.storeId} className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                          {b.qty} {row.product.unit}
                        </td>
                      ))}

                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        {row.totalQty} {row.product.unit}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Stock Operations (Приход / Списание / Перемещение / Инвентаризация) */}
        {activeTab === 'operation' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Складская операция
                </h3>
                <p className="text-xs text-slate-400">
                  Текущая точка: <span className="text-blue-500 font-bold">{currentStore?.name}</span>
                </p>
              </div>
            </div>

            {isSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Операция успешно проведена и остатки пересчитаны!</span>
              </div>
            )}

            <form onSubmit={handleExecuteOperation} className="space-y-4">
              
              {/* Operation type buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOpType('RECEIPT')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    opType === 'RECEIPT'
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span className="text-xs">Приход (Закупка)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOpType('WRITE_OFF')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    opType === 'WRITE_OFF'
                      ? 'bg-rose-600 text-white border-rose-500 font-bold shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span className="text-xs">Списание (Брак)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOpType('TRANSFER_OUT')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    opType === 'TRANSFER_OUT'
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="text-xs">Перемещение</span>
                </button>
              </div>

              {/* Product selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Товар:
                </label>
                <select
                  value={opProduct}
                  onChange={(e) => setOpProduct(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant selector */}
              {opVariants.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Вариант:
                  </label>
                  <select
                    value={opVariant}
                    onChange={(e) => setOpVariant(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    {opVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target store (for transfer) */}
              {opType === 'TRANSFER_OUT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Куда переместить (Точка назначения):
                  </label>
                  <select
                    value={opTargetStore}
                    onChange={(e) => setOpTargetStore(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-medium"
                  >
                    {stores
                      .filter((s) => s.id !== currentStore?.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Количество:
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={opQuantity}
                  onChange={(e) => setOpQuantity(e.target.value)}
                  className="w-full text-xl font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white"
                />
              </div>

              {/* Reference Document */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Номер документа / Накладной:
                  </label>
                  <input
                    type="text"
                    placeholder="ТОРГ-12 № 4410"
                    value={opRef}
                    onChange={(e) => setOpRef(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Примечание:
                  </label>
                  <input
                    type="text"
                    placeholder="Комментарий"
                    value={opNotes}
                    onChange={(e) => setOpNotes(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all"
              >
                Провести складской документ
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
};
