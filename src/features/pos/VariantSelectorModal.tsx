import React from 'react';
import { X, Layers, Check } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import type { Product, ProductVariant } from '../../types';

interface VariantSelectorModalProps {
  product: Product;
  onClose: () => void;
  onSelect: (variant: ProductVariant) => void;
}

export const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({
  product,
  onClose,
  onSelect,
}) => {
  const { variants, inventory, currentStore } = usePOS();

  const productVariants = variants.filter((v) => v.productId === product.id);

  const getVariantStock = (variantId: string) => {
    if (!currentStore) return 0;
    const inv = inventory.find((i) => i.storeId === currentStore.id && i.variantId === variantId);
    return inv ? inv.quantity : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
              <span className="text-[11px] text-slate-400">Выберите размер / цвет / модификацию</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variants List */}
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-96">
          {productVariants.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Модификации для данного товара не найдены.
            </div>
          ) : (
            productVariants.map((v) => {
              const stock = getVariantStock(v.id);
              const isOutOfStock = stock <= 0;

              return (
                <button
                  key={v.id}
                  disabled={isOutOfStock}
                  onClick={() => {
                    onSelect(v);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isOutOfStock
                      ? 'opacity-40 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 hover:border-blue-500 hover:shadow-md cursor-pointer group'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                      {v.name.split('/')[1]?.trim() || v.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {v.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Артикул: {v.sku} {v.barcode ? `• ${v.barcode}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {v.salePrice} ₽
                    </div>
                    <div className={`text-[10px] font-semibold ${stock <= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {isOutOfStock ? 'Нет в наличии' : `Остаток: ${stock} ${product.unit}`}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
