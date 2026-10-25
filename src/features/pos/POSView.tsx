import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  Tag,
  User,
  ArrowRight,
  AlertCircle,
  Layers,
  Sparkles,
  Package,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { sound } from '../../lib/sound';
import { VariantSelectorModal } from './VariantSelectorModal';
import { PaymentModal } from './PaymentModal';
import { CustomerModal } from './CustomerModal';
import { DiscountModal } from './DiscountModal';
import { ReceiptModal } from './ReceiptModal';
import type { Product, ProductVariant } from '../../types';

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    inventory,
    currentStore,
    currentShift,
    cart,
    cartTotals,
    addToCart,
    updateCartItemQty,
    setCartItemQty,
    removeCartItem,
    clearCart,
    holdCurrentCart,
    selectedCustomer,
    orderDiscountPercent,
    lastCompletedOrder,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
  } = usePOS();

  const [selectedCategoryState, setSelectedCategory] = useState<string>('cat-all');
  // Fall back to "all products" if the selected category was deleted
  const selectedCategory = categories.some((c) => c.id === selectedCategoryState) ? selectedCategoryState : 'cat-all';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVariantProduct, setActiveVariantProduct] = useState<Product | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [manualQtyModalItem, setManualQtyModalItem] = useState<{ id: string; name: string; qty: number } | null>(null);
  const [customQtyInput, setCustomQtyInput] = useState('');

  // Keyboard shortcuts (F1-F8, Esc)
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) holdCurrentCart();
      } else if (e.key === 'F7') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsDiscountModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [cart, holdCurrentCart]);

  // Stock lookup helper
  const getProductStock = (productId: string) => {
    if (!currentStore) return 0;
    const inv = inventory.filter((i) => i.storeId === currentStore.id && i.productId === productId);
    return inv.reduce((sum, i) => sum + i.quantity, 0);
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory = selectedCategory === 'cat-all' || prod.categoryId === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        prod.sku.toLowerCase().includes(query) ||
        (prod.barcode && prod.barcode.includes(query));

      return matchesCategory && matchesSearch && prod.active;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleProductClick = (prod: Product) => {
    if (prod.hasVariants) {
      setActiveVariantProduct(prod);
    } else {
      addToCart(prod, undefined, 1);
    }
  };

  const handleSelectVariant = (variant: ProductVariant) => {
    if (activeVariantProduct) {
      addToCart(activeVariantProduct, variant, 1);
      setActiveVariantProduct(null);
    }
  };

  const handleManualQtySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQtyModalItem) return;
    const num = parseFloat(customQtyInput);
    if (!isNaN(num) && num > 0) {
      setCartItemQty(manualQtyModalItem.id, num);
    }
    setManualQtyModalItem(null);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100 dark:bg-slate-950">
      
      {/* LEFT / CENTER: Products Grid & Quick Filters (65% width) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Search bar + Quick Scan Test Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0 shadow-2xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск товара по названию, артикулу или штрихкоду... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

        </div>

        {/* Categories Bar */}
        <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  sound.playKeypadClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 p-3 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Package className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Товары не найдены</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Попробуйте изменить поисковый запрос или выбрать другую категорию
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
              {filteredProducts.map((prod) => {
                const stock = getProductStock(prod.id);
                const isLowStock = stock <= prod.minStockAlert && stock > 0;
                const isOutOfStock = stock <= 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleProductClick(prod)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between cursor-pointer group select-none relative active:scale-97"
                  >
                    {/* Image & Badges */}
                    <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}

                      {/* Variants indicator */}
                      {prod.hasVariants && (
                        <span className="absolute top-1.5 left-1.5 bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <Layers className="w-3 h-3" />
                          <span>Опции</span>
                        </span>
                      )}

                      {/* Stock badge */}
                      <span
                        className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs ${
                          isOutOfStock
                            ? 'bg-rose-500/90 text-white'
                            : isLowStock
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-black/60 text-slate-200'
                        }`}
                      >
                        {isOutOfStock ? '0 шт' : `${stock} ${prod.unit}`}
                      </span>
                    </div>

                    {/* Title & SKU */}
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {prod.sku}
                      </p>
                    </div>

                    {/* Price and Add button */}
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {prod.salePrice.toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center font-bold text-sm shadow-2xs">
                        +
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT: Cart & Checkout Register Panel (35% width, fixed on desktop) */}
      <div className="w-full lg:w-[400px] xl:w-[430px] bg-white dark:bg-slate-900 flex flex-col shrink-0 border-t lg:border-t-0 shadow-xl z-20">
        
        {/* Customer & Shift status banner */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          {/* Customer button */}
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-colors ${
              selectedCustomer
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Привязать карту лояльности (F7)"
          >
            <div className="flex items-center gap-2 truncate">
              <User className={`w-3.5 h-3.5 ${selectedCustomer ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="font-semibold truncate">
                {selectedCustomer ? selectedCustomer.name : 'Клиент (F7)'}
              </span>
            </div>
            {selectedCustomer && (
              <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded ml-1 shrink-0">
                {selectedCustomer.bonusPoints} б.
              </span>
            )}
          </button>

          {/* Clear Cart Button */}
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Очистить корзину"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-3">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Чек пуст</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                Выберите товары из каталога слева или отсканируйте штрихкод сканером
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col gap-2 hover:border-slate-300 transition-colors"
              >
                {/* Item title & remove */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {item.productName}
                    </h5>
                    {item.variantName && (
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {item.variantName}
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.sku} • {item.unitPrice.toFixed(2)} ₽/{item.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => removeCartItem(item.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stepper + Item Total */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
                    <button
                      onClick={() => updateCartItemQty(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setManualQtyModalItem({ id: item.id, name: item.productName, qty: item.quantity });
                        setCustomQtyInput(item.quantity.toString());
                      }}
                      className="min-w-8 px-1 text-center font-black text-xs text-slate-900 dark:text-white hover:text-blue-600"
                      title="Кликните для ручного ввода количества"
                    >
                      {item.quantity}
                    </button>

                    <button
                      onClick={() => updateCartItemQty(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {item.totalPrice.toFixed(2)} ₽
                    </div>
                    {item.discountAmount > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600">
                        -{item.discountPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Cart Actions (Hold cart, Discount, Loyalty) */}
        {cart.length > 0 && (
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <button
              onClick={() => holdCurrentCart()}
              className="flex-1 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              title="Отложить чек (F6)"
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Отложить (F6)</span>
            </button>

            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs ${
                orderDiscountPercent > 0
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
              }`}
              title="Скидка на чек (F8)"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              <span>{orderDiscountPercent > 0 ? `Скидка -${orderDiscountPercent}%` : 'Скидка (F8)'}</span>
            </button>
          </div>
        )}

        {/* Totals & Big Checkout Button */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* Subtotals breakdown */}
          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Сумма позиций:</span>
              <span>{cartTotals.subtotal.toFixed(2)} ₽</span>
            </div>
            {cartTotals.totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Общая скидка:</span>
                <span>-{cartTotals.totalDiscount.toFixed(2)} ₽</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>В т.ч. НДС 20%:</span>
              <span>{cartTotals.taxAmount.toFixed(2)} ₽</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex items-baseline justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
              К оплате:
            </span>
            <div className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              {cartTotals.total.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
            </div>
          </div>

          {/* Big Checkout Button */}
          <button
            disabled={cart.length === 0}
            onClick={() => {
              if (cart.length > 0) {
                sound.playKeypadClick();
                setIsPaymentModalOpen(true);
              }
            }}
            className={`w-full py-4 px-4 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-xl select-none ${
              cart.length > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-98 cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>ОПЛАТИТЬ (F4)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Manual Quantity Stepper Modal */}
      {manualQtyModalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <form
            onSubmit={handleManualQtySubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-xs shadow-2xl space-y-4"
          >
            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Количество: {manualQtyModalItem.name}
            </h4>
            <input
              type="number"
              step="any"
              min="0.001"
              autoFocus
              value={customQtyInput}
              onChange={(e) => setCustomQtyInput(e.target.value)}
              className="w-full text-2xl font-black text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl py-3 text-slate-900 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setManualQtyModalItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Применить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Variant Selector Modal */}
      {activeVariantProduct && (
        <VariantSelectorModal
          product={activeVariantProduct}
          onClose={() => setActiveVariantProduct(null)}
          onSelect={handleSelectVariant}
        />
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal onClose={() => setIsPaymentModalOpen(false)} />
      )}

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <CustomerModal onClose={() => setIsCustomerModalOpen(false)} />
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <DiscountModal onClose={() => setIsDiscountModalOpen(false)} />
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && lastCompletedOrder && (
        <ReceiptModal
          order={lastCompletedOrder}
          onClose={() => {
            setIsReceiptModalOpen(false);
          }}
        />
      )}

    </div>
  );
};
