import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Barcode,
  Edit2,
  Trash2,
  Layers,
  AlertTriangle,
  Printer,
  X,
  Check,
  Building,
  Tags,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { generateBarcodeSvg } from '../../lib/escpos';
import { sound } from '../../lib/sound';
import type { Product, ProductVariant } from '../../types';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    variants,
    inventory,
    stores,
    currentStore,
    currentUser,
    saveProduct,
    deleteProduct,
    saveCategory,
    moveCategory,
    deleteCategory,
  } = usePOS();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Editable categories (the built-in "all products" filter is excluded)
  const editableCategories = categories.filter((c) => c.slug !== 'all');
  const activeCategory = editableCategories.some((c) => c.id === selectedCategory) ? selectedCategory : 'all';

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCatId, setFormCatId] = useState('cat-all');
  const [formUnit, setFormUnit] = useState('шт');
  const [formCost, setFormCost] = useState('0');
  const [formSale, setFormSale] = useState('0');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formTax, setFormTax] = useState('20');
  const [formImage, setFormImage] = useState('');
  const [formVariants, setFormVariants] = useState<
    { id?: string; name: string; sku: string; barcode?: string; salePrice: number; stock: Record<string, string> }[]
  >([]);
  // Stock per store for a product without variants
  const [formStock, setFormStock] = useState<Record<string, string>>({});

  // Permissions: only the administrator manages the catalog
  const canEdit = currentUser?.role === 'ADMIN';

  const emptyStock = () => Object.fromEntries(stores.map((s) => [s.id, '0']));
  const rowStock = (productId: string, variantId?: string) =>
    Object.fromEntries(
      stores.map((s) => [
        s.id,
        String(
          inventory.find((i) => i.productId === productId && i.storeId === s.id && i.variantId === variantId)?.quantity ?? 0
        ),
      ])
    );
  const parseStock = (st: Record<string, string>) =>
    Object.fromEntries(Object.entries(st).map(([k, v]) => [k, parseFloat(v)]));

  // Stock calculator across stores
  const getProductStock = (productId: string, storeId?: string) => {
    const list = storeId
      ? inventory.filter((i) => i.productId === productId && i.storeId === storeId)
      : inventory.filter((i) => i.productId === productId);
    return list.reduce((sum, item) => sum + item.quantity, 0);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));

      const stock = getProductStock(p.id, currentStore?.id);
      const matchesStock = !lowStockOnly || stock <= p.minStockAlert;

      return matchesCat && matchesSearch && matchesStock;
    });
  }, [products, activeCategory, search, lowStockOnly, currentStore, inventory]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    const randomSku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormSku(randomSku);
    setFormBarcode(`460${Math.floor(100000000 + Math.random() * 900000000)}`);
    setFormCatId(editableCategories[0]?.id || 'cat-all');
    setFormUnit('шт');
    setFormCost('100');
    setFormSale('180');
    setFormMinStock('5');
    setFormTax('20');
    setFormImage('https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80');
    setFormVariants([]);
    setFormStock(emptyStock());
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode || '');
    setFormCatId(editableCategories.some((c) => c.id === p.categoryId) ? p.categoryId : 'cat-all');
    setFormUnit(p.unit);
    setFormCost(p.costPrice.toString());
    setFormSale(p.salePrice.toString());
    setFormMinStock(p.minStockAlert.toString());
    setFormTax(p.taxRate.toString());
    setFormImage(p.image || '');

    const pVars = variants
      .filter((v) => v.productId === p.id)
      .map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode,
        salePrice: v.salePrice,
        stock: rowStock(p.id, v.id),
      }));
    setFormVariants(pVars);
    setFormStock(rowStock(p.id));
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;

    await saveProduct(
      {
        id: editingProduct?.id,
        categoryId: formCatId,
        name: formName.trim(),
        sku: formSku.trim(),
        barcode: formBarcode.trim() || undefined,
        unit: formUnit,
        costPrice: parseFloat(formCost) || 0,
        salePrice: parseFloat(formSale) || 0,
        minStockAlert: parseFloat(formMinStock) || 0,
        taxRate: parseFloat(formTax) || 20,
        image: formImage.trim() || undefined,
        hasVariants: formVariants.length > 0,
      },
      formVariants.length > 0 ? formVariants.map((v) => ({ ...v, stock: parseStock(v.stock) })) : undefined,
      parseStock(formStock)
    );

    setIsAddModalOpen(false);
  };

  const handleAddVariantRow = () => {
    setFormVariants((prev) => [
      ...prev,
      {
        name: `Вариант ${prev.length + 1}`,
        sku: `${formSku}-V${prev.length + 1}`,
        salePrice: parseFloat(formSale) || 0,
        stock: emptyStock(),
      },
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Артикул', 'Наименование', 'Категория', 'Штрихкод', 'Закупка', 'Розница', 'Остаток', 'Ед.изм'];
    const rows = products.map((p) => {
      const cat = editableCategories.find((c) => c.id === p.categoryId)?.name || '';
      const stock = getProductStock(p.id, currentStore?.id);
      return [p.sku, `"${p.name}"`, `"${cat}"`, p.barcode || '', p.costPrice, p.salePrice, stock, p.unit];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalog_omnipos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sound.playScanBeep();
  };

  // CSV Import Mock/File handler
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        // Simple importer for CSV
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
          if (parts[1]) {
            await saveProduct({
              name: parts[1],
              sku: parts[0] || `SKU-IMP-${i}`,
              barcode: parts[3] || `46099${i}10001`,
              salePrice: parseFloat(parts[5]) || 150,
              costPrice: parseFloat(parts[4]) || 80,
              unit: parts[7] || 'шт',
              categoryId: editableCategories[0]?.id || 'cat-all',
            });
          }
        }
        sound.playCashRegisterChime();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Top Action Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        
        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по названию, артикулу, штрихкоду..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={activeCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">Все категории</option>
            {categories.filter((c) => c.slug !== 'all').map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              lowStockOnly
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Заканчивающиеся</span>
          </button>
        </div>

        {/* Right CTA: Import / Export / Add Product */}
        <div className="flex items-center gap-2">
          {canEdit && (
          <label className="cursor-pointer py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">Импорт CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          )}

          <button
            onClick={handleExportCSV}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Экспорт</span>
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setCategoryNames({});
                setCategoryError(null);
                setIsCategoryModalOpen(true);
              }}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Tags className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Категории</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={openAddModal}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Создать товар</span>
            </button>
          )}
        </div>

      </div>

      {/* Products Table Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Товар</th>
                  <th className="py-3 px-3">Категория</th>
                  <th className="py-3 px-3">Артикул / Штрихкод</th>
                  <th className="py-3 px-3 text-right">Закупка</th>
                  <th className="py-3 px-3 text-right">Розница</th>
                  <th className="py-3 px-3 text-right">Остаток ({currentStore?.name.split('«')[1]?.replace('»', '') || 'Тек.'})</th>
                  <th className="py-3 px-3 text-center">Все точки</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Товары не найдены
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const cat = editableCategories.find((c) => c.id === prod.categoryId);
                    const stock = getProductStock(prod.id, currentStore?.id);
                    const allStoresStock = getProductStock(prod.id);
                    const isLow = stock <= prod.minStockAlert;
                    const prodVariants = variants.filter((v) => v.productId === prod.id);

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        
                        {/* Title & Image */}
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={prod.image || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=100&q=80'}
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white leading-tight">
                              {prod.name}
                            </div>
                            {prod.hasVariants && (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                                <Layers className="w-3 h-3" />
                                <span>{prodVariants.length} модификаций</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {cat?.name || 'Без категории'}
                          </span>
                        </td>

                        {/* SKU & Barcode */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          <div>{prod.sku}</div>
                          {prod.barcode && <div className="text-slate-400">{prod.barcode}</div>}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-3 text-right text-slate-500 font-medium">
                          {prod.costPrice.toFixed(2)} ₽
                        </td>

                        {/* Sale Price */}
                        <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                          {prod.salePrice.toFixed(2)} ₽
                        </td>

                        {/* Current Store Stock */}
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                              stock <= 0
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                : isLow
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                : 'text-slate-900 dark:text-slate-200'
                            }`}
                          >
                            {stock} {prod.unit}
                          </span>
                        </td>

                        {/* Total Across All Stores */}
                        <td className="py-3 px-3 text-center">
                          <span className="text-slate-500 font-semibold">
                            {allStoresStock} {prod.unit}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Barcode label print */}
                            <button
                              onClick={() => setLabelProduct(prod)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Печать этикетки / ценника"
                            >
                              <Barcode className="w-4 h-4 text-indigo-500" />
                            </button>

                            {canEdit && (
                              <>
                                <button
                                  onClick={() => openEditModal(prod)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                  title="Редактировать"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Удалить товар "${prod.name}"?`)) {
                                      deleteProduct(prod.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
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

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Редактирование товара' : 'Добавление нового товара'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Наименование товара:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Например: Сыр Пармезан 200г"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Артикул (SKU):
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Штрихкод (EAN-13):
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      placeholder="460..."
                      className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setFormBarcode(`460${Math.floor(100000000 + Math.random() * 900000000)}`)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[11px] font-bold border border-slate-300 dark:border-slate-700"
                      title="Сгенерировать случайный штрихкод"
                    >
                      Ген
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Категория:
                  </label>
                  <select
                    value={formCatId}
                    onChange={(e) => setFormCatId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="cat-all">Без категории</option>
                    {editableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Единица измерения:
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="шт">шт (штука)</option>
                    <option value="кг">кг (килограмм)</option>
                    <option value="л">л (литр)</option>
                    <option value="уп">уп (упаковка)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Мин. остаток (алерт):
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Закупочная цена (₽):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Розничная цена (₽):
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formSale}
                    onChange={(e) => setFormSale(e.target.value)}
                    className="w-full text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ссылка на изображение (URL):
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              {/* Variants Section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Модификации / Варианты (Размеры, цвета)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    + Добавить вариант
                  </button>
                </div>

                {formVariants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Название (e.g. Черный / M)"
                      value={v.name}
                      onChange={(e) => {
                        const copy = [...formVariants];
                        copy[idx].name = e.target.value;
                        setFormVariants(copy);
                      }}
                      className="flex-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Артикул"
                      value={v.sku}
                      onChange={(e) => {
                        const copy = [...formVariants];
                        copy[idx].sku = e.target.value;
                        setFormVariants(copy);
                      }}
                      className="flex-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                    />
                    <input
                      type="number"
                      placeholder="Цена"
                      value={v.salePrice}
                      onChange={(e) => {
                        const copy = [...formVariants];
                        copy[idx].salePrice = parseFloat(e.target.value) || 0;
                        setFormVariants(copy);
                      }}
                      className="w-20 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantRow(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Stock per store */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Остатки по магазинам ({formUnit})
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="text-left font-semibold py-1 pr-2">{formVariants.length > 0 ? 'Вариант' : 'Товар'}</th>
                        {stores.map((st) => (
                          <th key={st.id} className="text-left font-semibold py-1 px-1">
                            {st.name.split('«')[1]?.split('»')[0] || st.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(formVariants.length > 0
                        ? formVariants.map((v, idx) => ({ label: v.name || `Вариант ${idx + 1}`, stock: v.stock, idx }))
                        : [{ label: formName || 'Без вариантов', stock: formStock, idx: -1 }]
                      ).map((row) => (
                        <tr key={row.idx}>
                          <td className="py-1 pr-2 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{row.label}</td>
                          {stores.map((st) => (
                            <td key={st.id} className="py-1 px-1">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.stock[st.id] ?? '0'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (row.idx < 0) {
                                    setFormStock((prev) => ({ ...prev, [st.id]: val }));
                                  } else {
                                    setFormVariants((prev) =>
                                      prev.map((v, i) => (i === row.idx ? { ...v, stock: { ...v.stock, [st.id]: val } } : v))
                                    );
                                  }
                                }}
                                className="w-20 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Сохранить товар
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">Категории товаров</h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCategoryName.trim()) return;
                  await saveCategory({ name: newCategoryName });
                  setNewCategoryName('');
                  setCategoryError(null);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Название новой категории"
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить</span>
                </button>
              </form>

              {categoryError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400">
                  {categoryError}
                </div>
              )}

              {editableCategories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Категорий пока нет</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  {editableCategories.map((cat, idx) => {
                    const productCount = products.filter((p) => p.categoryId === cat.id).length;
                    const draft = categoryNames[cat.id] ?? cat.name;
                    return (
                      <div key={cat.id} className="flex items-center gap-2 px-3 py-2">
                        <input
                          type="text"
                          value={draft}
                          onChange={(e) => setCategoryNames((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                          onBlur={async () => {
                            if (draft.trim() && draft !== cat.name) await saveCategory({ id: cat.id, name: draft });
                            setCategoryNames((prev) => {
                              const { [cat.id]: _, ...rest } = prev;
                              return rest;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                          className="flex-1 min-w-0 text-xs font-semibold bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 dark:hover:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white"
                        />
                        <span className="text-[11px] text-slate-400 shrink-0">{productCount} тов.</span>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCategory(cat.id, -1)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg disabled:opacity-30"
                          title="Выше"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === editableCategories.length - 1}
                          onClick={() => moveCategory(cat.id, 1)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg disabled:opacity-30"
                          title="Ниже"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Удалить категорию "${cat.name}"?`)) return;
                            const ok = await deleteCategory(cat.id);
                            setCategoryError(
                              ok ? null : `В категории «${cat.name}» есть товары (${productCount}). Сначала перенесите их в другую категорию.`
                            );
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Удалить категорию"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Название меняется прямо в списке. Порядок категорий совпадает с порядком кнопок на кассе.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barcode & Price Tag Label Printer Preview Modal */}
      {labelProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Печать ценника / этикетки
              </h4>
              <button
                onClick={() => setLabelProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sticker Graphic Preview */}
            <div className="p-4 bg-white border-2 border-slate-900 rounded-xl text-slate-900 shadow-md space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider text-center">
                {currentStore?.name}
              </div>
              <div className="font-bold text-xs text-center leading-snug">
                {labelProduct.name}
              </div>
              <div className="text-center font-black text-2xl tracking-tight text-slate-950">
                {labelProduct.salePrice} ₽
              </div>
              <div className="text-[10px] text-center text-slate-500 font-mono">
                {labelProduct.sku}
              </div>
              <div
                className="flex justify-center"
                dangerouslySetInnerHTML={{
                  __html: generateBarcodeSvg(labelProduct.barcode || labelProduct.sku),
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setLabelProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Напечатать</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
