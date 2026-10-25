import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  db,
  initDatabase,
  INITIAL_STORES,
} from '../lib/db';
import { sound } from '../lib/sound';
import type {
  Store,
  User,
  Category,
  Product,
  ProductVariant,
  InventoryItem,
  Order,
  OrderItem,
  PaymentRecord,
  Shift,
  Customer,
  StockMovement,
  CartItem,
  HeldCart,
  POSSettings,
  PaymentMethod,
} from '../types';

interface POSContextType {
  // State
  stores: Store[];
  currentStore: Store | null;
  users: User[];
  currentUser: User | null;
  currentShift: Shift | null;
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  inventory: InventoryItem[];
  customers: Customer[];
  heldCarts: HeldCart[];
  orders: Order[];
  cart: CartItem[];
  selectedCustomer: Customer | null;
  orderDiscountPercent: number;
  settings: POSSettings;
  isOffline: boolean;
  isSyncing: boolean;
  activeTab: 'pos' | 'products' | 'sales' | 'inventory' | 'reports' | 'settings';
  lastCompletedOrder: Order | null;
  isReceiptModalOpen: boolean;

  // Actions
  setActiveTab: (tab: 'pos' | 'products' | 'sales' | 'inventory' | 'reports' | 'settings') => void;
  switchStore: (storeId: string) => Promise<void>;
  switchUser: (userId: string, pin: string) => Promise<boolean>;
  logout: () => void;
  updateSettings: (newSettings: Partial<POSSettings>) => Promise<void>;
  setLanguage: (lang: 'ru' | 'en') => Promise<void>;
  setCurrency: (curr: string) => Promise<void>;
  toggleSound: () => void;
  toggleTheme: () => void;

  // Cart Actions
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  addToCartByBarcode: (barcode: string) => boolean;
  updateCartItemQty: (itemId: string, delta: number) => void;
  setCartItemQty: (itemId: string, qty: number) => void;
  setCartItemDiscount: (itemId: string, discountPercent: number) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  setOrderDiscountPercent: (percent: number) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  holdCurrentCart: (name?: string) => Promise<void>;
  restoreHeldCart: (heldCartId: string) => Promise<void>;
  deleteHeldCart: (heldCartId: string) => Promise<void>;

  // Shift & Cash Drawer Actions
  openShift: (openingCash: number, notes?: string) => Promise<void>;
  closeShift: (closingCash: number, notes?: string) => Promise<Shift | null>;
  cashDrawerInOut: (type: 'IN' | 'OUT', amount: number, reason: string) => Promise<void>;

  // Checkout & Sales
  completeSale: (
    paymentMethod: PaymentMethod,
    paidAmount: number,
    bonusApplied?: number,
    mixedPayments?: { method: PaymentMethod; amount: number; referenceCode?: string }[],
    notes?: string
  ) => Promise<Order>;
  refundOrder: (orderId: string, reason: string) => Promise<void>;

  // Catalog & Inventory
  saveProduct: (
    product: Partial<Product>,
    variantsList?: (Partial<ProductVariant> & { stock?: Record<string, number> })[],
    stock?: Record<string, number>
  ) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCategory: (category: { id?: string; name: string }) => Promise<void>;
  moveCategory: (categoryId: string, direction: -1 | 1) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
  saveCustomer: (customer: Partial<Customer>) => Promise<Customer>;
  saveStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => Promise<void>;
  refreshData: () => Promise<void>;
  resetDatabase: (storeType?: string) => Promise<void>;

  // Modals
  setLastCompletedOrder: (order: Order | null) => void;
  setIsReceiptModalOpen: (open: boolean) => void;

  // Calculations
  cartTotals: {
    itemsCount: number;
    subtotal: number;
    positionDiscounts: number;
    orderDiscount: number;
    totalDiscount: number;
    taxAmount: number;
    total: number;
  };
}

const POSContext = createContext<POSContextType | null>(null);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'pos' | 'products' | 'sales' | 'inventory' | 'reports' | 'settings'>('pos');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  const [settings, setSettings] = useState<POSSettings>({
    storeId: 'store-1',
    currency: 'RUB',
    language: 'ru',
    soundEnabled: true,
    theme: 'light',
    printerWidth: '80mm',
    autoPrintReceipt: true,
    openCashDrawerOnSale: true,
    scannerSound: true,
  });

  // Track online / offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 1200);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial load
  const refreshData = useCallback(async () => {
    await initDatabase();

    const [allStores, allUsers, allCats, allProds, allVars, allInv, allCust, allHeld, allOrders, currentSettings] =
      await Promise.all([
        db.stores.toArray(),
        db.users.toArray(),
        db.categories.toArray(),
        db.products.toArray(),
        db.variants.toArray(),
        db.inventory.toArray(),
        db.customers.toArray(),
        db.heldCarts.toArray(),
        db.orders.orderBy('createdAt').reverse().toArray(),
        db.settings.toCollection().first(),
      ]);

    setStores(allStores);
    setUsers(allUsers);
    setCategories(allCats.sort((a, b) => a.order - b.order));
    setProducts(allProds);
    setVariants(allVars);
    setInventory(allInv);
    setCustomers(allCust);
    setHeldCarts(allHeld);
    setOrders(allOrders);

    if (currentSettings) {
      setSettings(currentSettings);
      sound.enabled = currentSettings.soundEnabled;
    }

    // Set active store
    const store = (currentSettings && allStores.find((s) => s.id === currentSettings.storeId)) || allStores[0] || null;
    setCurrentStore(store);

    // Keep the signed-in user across refreshes; nobody is signed in until a PIN is entered
    setCurrentUser((prev) => (prev && allUsers.find((u) => u.id === prev.id)) || null);

    // Check open shift
    if (store) {
      const openShift = await db.shifts
        .filter((s) => s.storeId === store.id && s.status === 'OPEN')
        .last();
      setCurrentShift(openShift || null);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Sync sound setting
  useEffect(() => {
    sound.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Theme handling
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Switch store
  const switchStore = async (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;
    setCurrentStore(store);
    const newSettings = { ...settings, storeId };
    setSettings(newSettings);
    await db.settings.put(newSettings);

    // Find shift in this store
    const openShift = await db.shifts
      .filter((s) => s.storeId === storeId && s.status === 'OPEN')
      .last();
    setCurrentShift(openShift || null);
    sound.playKeypadClick();
  };

  // Sign in / switch user; every user requires their PIN code
  const switchUser = async (userId: string, pin: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    if (pin !== user.pinCode) {
      sound.playErrorBuzzer();
      return false;
    }
    setCurrentUser(user);
    sound.playKeypadClick();
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('pos');
    sound.playKeypadClick();
  };

  const updateSettings = async (newSettings: Partial<POSSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await db.settings.put(updated);
  };

  const setLanguage = async (lang: 'ru' | 'en') => {
    await updateSettings({ language: lang });
  };

  const setCurrency = async (curr: string) => {
    await updateSettings({ currency: curr });
    if (currentStore) {
      const updatedStore = { ...currentStore, currency: curr };
      setCurrentStore(updatedStore);
      await db.stores.put(updatedStore);
    }
  };

  const toggleSound = () => {
    const nextVal = !settings.soundEnabled;
    updateSettings({ soundEnabled: nextVal });
    sound.enabled = nextVal;
    if (nextVal) sound.playScanBeep();
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  // Inventory row for a product (or a specific variant) in a store
  const findInventory = async (storeId: string, productId: string, variantId?: string) => {
    const rows = await db.inventory.where({ storeId, productId }).toArray();
    return (variantId && rows.find((r) => r.variantId === variantId)) || rows[0];
  };

  // Cart Calculations
  const cartTotals = useMemo(() => {
    let itemsCount = 0;
    let subtotal = 0;
    let positionDiscounts = 0;

    cart.forEach((item) => {
      itemsCount += item.quantity;
      subtotal += item.originalPrice * item.quantity;
      positionDiscounts += item.discountAmount * item.quantity;
    });

    const subtotalAfterPositionDisc = Math.max(0, subtotal - positionDiscounts);
    const orderDiscount = (subtotalAfterPositionDisc * orderDiscountPercent) / 100;
    const total = Math.max(0, subtotalAfterPositionDisc - orderDiscount);

    // Approximate tax (included in price)
    const taxRate = currentStore?.defaultTaxRate ?? 20;
    const taxAmount = (total * taxRate) / (100 + taxRate);

    return {
      itemsCount,
      subtotal,
      positionDiscounts,
      orderDiscount,
      totalDiscount: positionDiscounts + orderDiscount,
      taxAmount,
      total,
    };
  }, [cart, orderDiscountPercent, currentStore]);

  // Cart operations
  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1) => {
    const unitPrice = variant ? variant.salePrice : product.salePrice;
    const costPrice = variant?.costPrice ?? product.costPrice;
    const sku = variant ? variant.sku : product.sku;
    const barcode = variant ? variant.barcode : product.barcode;
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) => {
          if (item.id === itemId) {
            const nextQty = item.quantity + quantity;
            const singleDiscountAmt = (item.originalPrice * item.discountPercent) / 100;
            const finalUnitPrice = item.originalPrice - singleDiscountAmt;
            return {
              ...item,
              quantity: nextQty,
              totalPrice: finalUnitPrice * nextQty,
            };
          }
          return item;
        });
      }

      const singleDiscountAmt = 0;
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          variantId: variant?.id,
          productName: product.name,
          variantName: variant?.name,
          sku,
          barcode,
          unit: product.unit,
          costPrice,
          originalPrice: unitPrice,
          unitPrice,
          quantity,
          discountPercent: 0,
          discountAmount: singleDiscountAmt,
          totalPrice: unitPrice * quantity,
        },
      ];
    });

    sound.playScanBeep();
  };

  // Add to cart by scanning barcode
  const addToCartByBarcode = (barcode: string): boolean => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return false;

    // Check variant barcode first
    const matchedVariant = variants.find((v) => v.barcode === cleanBarcode || v.sku === cleanBarcode);
    if (matchedVariant) {
      const parentProd = products.find((p) => p.id === matchedVariant.productId);
      if (parentProd) {
        addToCart(parentProd, matchedVariant, 1);
        return true;
      }
    }

    // Check product barcode
    const matchedProduct = products.find((p) => p.barcode === cleanBarcode || p.sku.toLowerCase() === cleanBarcode.toLowerCase());
    if (matchedProduct) {
      // If product has variants and user scanned base barcode, take first variant or add directly
      if (matchedProduct.hasVariants) {
        const prodVariants = variants.filter((v) => v.productId === matchedProduct.id);
        if (prodVariants.length > 0) {
          addToCart(matchedProduct, prodVariants[0], 1);
          return true;
        }
      }
      addToCart(matchedProduct, undefined, 1);
      return true;
    }

    sound.playErrorBuzzer();
    return false;
  };

  const updateCartItemQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = Math.max(0, item.quantity + delta);
            if (newQty === 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
    sound.playKeypadClick();
  };

  const setCartItemQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeCartItem(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: qty,
            totalPrice: item.unitPrice * qty,
          };
        }
        return item;
      })
    );
  };

  const setCartItemDiscount = (itemId: string, discountPercent: number) => {
    const clampedDiscount = Math.min(100, Math.max(0, discountPercent));
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const discAmt = (item.originalPrice * clampedDiscount) / 100;
          const discountedUnit = item.originalPrice - discAmt;
          return {
            ...item,
            discountPercent: clampedDiscount,
            discountAmount: discAmt,
            unitPrice: discountedUnit,
            totalPrice: discountedUnit * item.quantity,
          };
        }
        return item;
      })
    );
    sound.playKeypadClick();
  };

  const removeCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    sound.playKeypadClick();
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderDiscountPercent(0);
    sound.playKeypadClick();
  };

  // Hold (Park) cart
  const holdCurrentCart = async (name?: string) => {
    if (cart.length === 0) return;
    const newHeld: HeldCart = {
      id: `held-${Date.now()}`,
      number: heldCarts.length + 1,
      createdAt: Date.now(),
      name: name || `Чек #${heldCarts.length + 1} (${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})`,
      items: [...cart],
      customer: selectedCustomer || undefined,
      orderDiscountPercent,
    };
    await db.heldCarts.add(newHeld);
    setHeldCarts((prev) => [newHeld, ...prev]);
    clearCart();
    sound.playKeypadClick();
  };

  // Restore held cart
  const restoreHeldCart = async (heldCartId: string) => {
    const found = heldCarts.find((h) => h.id === heldCartId);
    if (!found) return;
    setCart(found.items);
    setSelectedCustomer(found.customer || null);
    setOrderDiscountPercent(found.orderDiscountPercent || 0);
    await db.heldCarts.delete(heldCartId);
    setHeldCarts((prev) => prev.filter((h) => h.id !== heldCartId));
    sound.playKeypadClick();
  };

  const deleteHeldCart = async (heldCartId: string) => {
    await db.heldCarts.delete(heldCartId);
    setHeldCarts((prev) => prev.filter((h) => h.id !== heldCartId));
    sound.playKeypadClick();
  };

  // Shifts
  const openShift = async (openingCash: number, notes?: string) => {
    if (!currentStore || !currentUser) return;
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      storeId: currentStore.id,
      userId: currentUser.id,
      userName: currentUser.name,
      openedAt: Date.now(),
      status: 'OPEN',
      openingCash,
      cashDrawerIn: 0,
      cashDrawerOut: 0,
      totalSalesCash: 0,
      totalSalesCard: 0,
      totalSalesBonus: 0,
      totalSales: 0,
      ordersCount: 0,
      returnsCount: 0,
      returnsTotal: 0,
      notes: notes || 'Смена открыта',
    };
    await db.shifts.add(newShift);
    setCurrentShift(newShift);
    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'SHIFT_OPEN',
      entity: 'Shift',
      entityId: newShift.id,
      details: `Открыта смена с разменным фондом ${openingCash} ${currentStore.currency}`,
      timestamp: Date.now(),
    });
    sound.playCashRegisterChime();
  };

  const closeShift = async (closingCash: number, notes?: string): Promise<Shift | null> => {
    if (!currentShift) return null;
    const closed: Shift = {
      ...currentShift,
      status: 'CLOSED',
      closedAt: Date.now(),
      closingCash,
      notes: notes || currentShift.notes,
    };
    await db.shifts.put(closed);
    setCurrentShift(null);
    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: 'SHIFT_CLOSE',
      entity: 'Shift',
      entityId: closed.id,
      details: `Закрыта смена. Фактическая наличность в кассе: ${closingCash} ${currentStore?.currency}`,
      timestamp: Date.now(),
    });
    sound.playKeypadClick();
    return closed;
  };

  const cashDrawerInOut = async (type: 'IN' | 'OUT', amount: number, reason: string) => {
    if (!currentShift) return;
    const updated = {
      ...currentShift,
      cashDrawerIn: type === 'IN' ? currentShift.cashDrawerIn + amount : currentShift.cashDrawerIn,
      cashDrawerOut: type === 'OUT' ? currentShift.cashDrawerOut + amount : currentShift.cashDrawerOut,
    };
    await db.shifts.put(updated);
    setCurrentShift(updated);
    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      userId: currentUser?.id,
      userName: currentUser?.name,
      action: type === 'IN' ? 'CASH_IN' : 'CASH_OUT',
      entity: 'Shift',
      entityId: currentShift.id,
      details: `${type === 'IN' ? 'Внесение' : 'Изъятие'}: ${amount} ${currentStore?.currency}. Причина: ${reason}`,
      timestamp: Date.now(),
    });
    sound.playCashRegisterChime();
  };

  // Complete sale
  const completeSale = async (
    paymentMethod: PaymentMethod,
    paidAmount: number,
    bonusApplied = 0,
    mixedPayments?: { method: PaymentMethod; amount: number; referenceCode?: string }[],
    notes?: string
  ): Promise<Order> => {
    if (!currentStore || !currentUser || cart.length === 0) {
      throw new Error('Невозможно завершить продажу: пустая корзина или нет кассира');
    }

    const receiptNum = `${String(orders.length + 1).padStart(4, '0')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const orderId = `ord-${Date.now()}`;
    const totalAmount = cartTotals.total;
    const changeAmount = Math.max(0, paidAmount - totalAmount);

    // Compute bonus points earned (3% of total)
    const bonusEarned = selectedCustomer ? Math.floor(totalAmount * 0.03) : 0;

    // Payments breakdown
    const paymentsList: PaymentRecord[] = mixedPayments && mixedPayments.length > 0
      ? mixedPayments.map((p, idx) => ({
          id: `pay-${orderId}-${idx}`,
          orderId,
          method: p.method,
          amount: p.amount,
          referenceCode: p.referenceCode,
          createdAt: Date.now(),
        }))
      : [
          {
            id: `pay-${orderId}-1`,
            orderId,
            method: paymentMethod,
            amount: paidAmount,
            createdAt: Date.now(),
          },
        ];

    // Order items
    const orderItems: OrderItem[] = cart.map((c, idx) => ({
      id: `oi-${orderId}-${idx}`,
      orderId,
      productId: c.productId,
      variantId: c.variantId,
      productName: c.productName,
      variantName: c.variantName,
      sku: c.sku,
      unitPrice: c.unitPrice,
      costPrice: c.costPrice,
      quantity: c.quantity,
      discountAmt: c.discountAmount * c.quantity,
      totalPrice: c.totalPrice,
    }));

    const newOrder: Order = {
      id: orderId,
      receiptNumber: receiptNum,
      storeId: currentStore.id,
      userId: currentUser.id,
      userName: currentUser.name,
      shiftId: currentShift?.id,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      status: 'COMPLETED',
      subtotal: cartTotals.subtotal,
      discountAmount: cartTotals.totalDiscount,
      discountRate: orderDiscountPercent,
      taxAmount: cartTotals.taxAmount,
      totalAmount,
      paidAmount,
      changeAmount,
      bonusApplied,
      bonusEarned,
      paymentMethod,
      payments: paymentsList,
      items: orderItems,
      notes,
      createdAt: Date.now(),
    };

    // Save to DB
    await db.orders.add(newOrder);
    await db.orderItems.bulkAdd(orderItems);

    // Deduct stock in inventory & create stock movement
    for (const [idx, item] of cart.entries()) {
      const currentInv = await findInventory(currentStore.id, item.productId, item.variantId);
      if (currentInv) {
        const newQty = Math.max(0, currentInv.quantity - item.quantity);
        await db.inventory.update(currentInv.id, { quantity: newQty });
      }

      await db.stockMovements.add({
        id: `mov-sale-${orderId}-${idx}`,
        storeId: currentStore.id,
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        variantName: item.variantName,
        type: 'SALE',
        quantity: -item.quantity,
        unitCost: item.costPrice,
        reference: `ЧЕК № ${receiptNum}`,
        notes: 'Розничная продажа',
        createdAt: Date.now(),
        userName: currentUser.name,
      });
    }

    // Update customer bonuses if customer attached
    if (selectedCustomer) {
      const updatedBonus = Math.max(0, selectedCustomer.bonusPoints - bonusApplied + bonusEarned);
      const updatedTotalSpent = selectedCustomer.totalSpent + totalAmount;
      await db.customers.update(selectedCustomer.id, {
        bonusPoints: updatedBonus,
        totalSpent: updatedTotalSpent,
      });
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, bonusPoints: updatedBonus, totalSpent: updatedTotalSpent } : c))
      );
    }

    // Update shift totals
    if (currentShift) {
      const isCash = paymentMethod === 'CASH' || (mixedPayments && mixedPayments.some((p) => p.method === 'CASH'));
      // Change is given back from the drawer, so count only the net cash
      const cashAmount = isCash
        ? (paymentMethod === 'CASH'
            ? totalAmount
            : Math.max(0, (mixedPayments?.find((p) => p.method === 'CASH')?.amount || 0) - changeAmount))
        : 0;
      const cardAmount = paymentMethod === 'CARD'
        ? totalAmount
        : (mixedPayments?.find((p) => p.method === 'CARD')?.amount || 0);

      const updatedShift: Shift = {
        ...currentShift,
        ordersCount: currentShift.ordersCount + 1,
        totalSales: currentShift.totalSales + totalAmount,
        totalSalesCash: currentShift.totalSalesCash + cashAmount,
        totalSalesCard: currentShift.totalSalesCard + cardAmount,
        totalSalesBonus: currentShift.totalSalesBonus + bonusApplied,
      };
      await db.shifts.put(updatedShift);
      setCurrentShift(updatedShift);
    }

    // Refresh state
    setOrders((prev) => [newOrder, ...prev]);
    setLastCompletedOrder(newOrder);
    setIsReceiptModalOpen(true);
    clearCart();

    // Sound effect
    sound.playCashRegisterChime();

    return newOrder;
  };

  // Refund Order
  const refundOrder = async (orderId: string, reason: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === 'REFUNDED') return;

    await db.orders.update(orderId, {
      status: 'REFUNDED',
      refundedAt: Date.now(),
      refundReason: reason,
    });

    // Return items back to stock
    for (const [idx, item] of order.items.entries()) {
      const currentInv = await findInventory(order.storeId, item.productId, item.variantId);
      if (currentInv) {
        await db.inventory.update(currentInv.id, { quantity: currentInv.quantity + item.quantity });
      }

      await db.stockMovements.add({
        id: `mov-refund-${order.id}-${idx}`,
        storeId: order.storeId,
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        variantName: item.variantName,
        type: 'RETURN',
        quantity: item.quantity,
        reference: `ВОЗВРАТ ЧЕКА № ${order.receiptNumber}`,
        notes: `Причина возврата: ${reason}`,
        createdAt: Date.now(),
        userName: currentUser?.name,
      });
    }

    // Reverse customer bonuses and total spent
    if (order.customerId) {
      const cust = await db.customers.get(order.customerId);
      if (cust) {
        await db.customers.update(cust.id, {
          bonusPoints: Math.max(0, cust.bonusPoints + (order.bonusApplied || 0) - (order.bonusEarned || 0)),
          totalSpent: Math.max(0, cust.totalSpent - order.totalAmount),
        });
      }
    }

    // Update shift return stats
    if (currentShift) {
      const updatedShift: Shift = {
        ...currentShift,
        returnsCount: currentShift.returnsCount + 1,
        returnsTotal: currentShift.returnsTotal + order.totalAmount,
      };
      await db.shifts.put(updatedShift);
      setCurrentShift(updatedShift);
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'REFUNDED', refundedAt: Date.now(), refundReason: reason } : o))
    );
    await refreshData();
    sound.playKeypadClick();
  };

  // Catalog methods
  const saveProduct = async (
    productData: Partial<Product>,
    variantsList?: (Partial<ProductVariant> & { stock?: Record<string, number> })[],
    stock?: Record<string, number>
  ) => {
    const prodId = productData.id || `prod-${Date.now()}`;
    const product: Product = {
      id: prodId,
      categoryId: productData.categoryId || 'cat-all', // 'cat-all' = no category
      name: productData.name || 'Новый товар',
      sku: productData.sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: productData.barcode || `${Math.floor(460000000000 + Math.random() * 90000000000)}`,
      description: productData.description || '',
      unit: productData.unit || 'шт',
      costPrice: Number(productData.costPrice) || 0,
      salePrice: Number(productData.salePrice) || 0,
      minStockAlert: Number(productData.minStockAlert) || 0,
      hasVariants: !!variantsList && variantsList.length > 0,
      taxRate: Number(productData.taxRate) || 20,
      image: productData.image || 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80',
      active: true,
    };

    await db.products.put(product);

    // Replace variants (removed ones are deleted together with their stock)
    const newVariants: ProductVariant[] = (variantsList || []).map((v, idx) => ({
      id: v.id || `var-${prodId}-${Date.now()}-${idx}`,
      productId: prodId,
      name: v.name || `Вариант ${idx + 1}`,
      sku: v.sku || `${product.sku}-V${idx + 1}`,
      barcode: v.barcode || `${product.barcode}${idx + 1}`,
      salePrice: Number(v.salePrice) || product.salePrice,
      costPrice: Number(v.costPrice) || product.costPrice,
      attributes: v.attributes || {},
    }));
    await db.variants.where({ productId: prodId }).delete();
    if (newVariants.length > 0) await db.variants.bulkPut(newVariants);

    // Stock per store: one row per variant, or one row for a product without variants
    const existingRows = await db.inventory.where({ productId: prodId }).toArray();
    const targets = product.hasVariants
      ? newVariants.flatMap((v, idx) =>
          stores.map((st) => ({ storeId: st.id, variant: v, quantity: variantsList?.[idx]?.stock?.[st.id] }))
        )
      : stores.map((st) => ({ storeId: st.id, variant: undefined as ProductVariant | undefined, quantity: stock?.[st.id] }));

    const keptIds = new Set<string>();
    for (const t of targets) {
      const row = existingRows.find((r) => r.storeId === t.storeId && r.variantId === t.variant?.id);
      const oldQty = row?.quantity ?? 0;
      const newQty = t.quantity === undefined || isNaN(t.quantity) ? oldQty : Math.max(0, t.quantity);
      const rowId = row?.id || `inv-${t.storeId}-${t.variant?.id || prodId}`;
      keptIds.add(rowId);
      await db.inventory.put({
        id: rowId,
        storeId: t.storeId,
        productId: prodId,
        variantId: t.variant?.id,
        quantity: newQty,
        reservedQty: row?.reservedQty ?? 0,
        location: row?.location || 'Основной зал',
      });
      if (newQty !== oldQty) {
        await db.stockMovements.add({
          id: `mov-adj-${rowId}-${Date.now()}`,
          storeId: t.storeId,
          productId: prodId,
          productName: product.name,
          variantId: t.variant?.id,
          variantName: t.variant?.name,
          type: 'INVENTORY_ADJ',
          quantity: newQty - oldQty,
          unitCost: t.variant?.costPrice ?? product.costPrice,
          reference: 'КАРТОЧКА ТОВАРА',
          notes: 'Изменение остатка администратором',
          createdAt: Date.now(),
          userName: currentUser?.name,
        });
      }
    }
    const staleIds = existingRows.filter((r) => !keptIds.has(r.id)).map((r) => r.id);
    if (staleIds.length > 0) await db.inventory.bulkDelete(staleIds);

    await refreshData();
    sound.playScanBeep();
  };

  const deleteProduct = async (productId: string) => {
    await db.products.delete(productId);
    await db.variants.where({ productId }).delete();
    await db.inventory.where({ productId }).delete();
    await refreshData();
  };

  // Categories ('cat-all' is the built-in "all products" filter and is not editable)
  const saveCategory = async (catData: { id?: string; name: string }) => {
    const existing = categories.find((c) => c.id === catData.id);
    const id = existing?.id || `cat-${Date.now()}`;
    await db.categories.put({
      ...existing,
      id,
      name: catData.name.trim() || 'Новая категория',
      slug: existing?.slug || id,
      order: existing?.order ?? Math.max(0, ...categories.map((c) => c.order)) + 1,
    });
    await refreshData();
  };

  const moveCategory = async (categoryId: string, direction: -1 | 1) => {
    const list = categories.filter((c) => c.slug !== 'all');
    const idx = list.findIndex((c) => c.id === categoryId);
    const other = list[idx + direction];
    if (idx < 0 || !other) return;
    const current = list[idx];
    await db.categories.bulkPut([
      { ...current, order: other.order },
      { ...other, order: current.order },
    ]);
    await refreshData();
  };

  // Refuses (returns false) while products still use the category
  const deleteCategory = async (categoryId: string) => {
    if (categoryId === 'cat-all' || products.some((p) => p.categoryId === categoryId)) return false;
    await db.categories.delete(categoryId);
    await refreshData();
    return true;
  };

  const saveCustomer = async (custData: Partial<Customer>): Promise<Customer> => {
    const custId = custData.id || `cust-${Date.now()}`;
    const cust: Customer = {
      id: custId,
      name: custData.name || 'Покупатель',
      phone: custData.phone || '+7 (999) 000-00-00',
      email: custData.email,
      cardNumber: custData.cardNumber || `CARD-${Date.now().toString().slice(-4)}`,
      bonusPoints: custData.bonusPoints || 0,
      discountPercent: custData.discountPercent || 0,
      totalSpent: custData.totalSpent || 0,
    };
    await db.customers.put(cust);
    await refreshData();
    return cust;
  };

  const saveStockMovement = async (mov: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const newMovement: StockMovement = {
      ...mov,
      id: `mov-${Date.now()}`,
      createdAt: Date.now(),
      userName: currentUser?.name,
    };
    await db.stockMovements.add(newMovement);

    // Apply quantity adjustments to inventory table
    const currentInv = await findInventory(mov.storeId, mov.productId, mov.variantId);

    if (currentInv) {
      let delta = mov.quantity;
      if (mov.type === 'WRITE_OFF' || mov.type === 'SALE' || mov.type === 'TRANSFER_OUT') {
        delta = -Math.abs(mov.quantity);
      }
      const newQty = Math.max(0, currentInv.quantity + delta);
      await db.inventory.update(currentInv.id, { quantity: newQty });
    }

    // If transfer between stores, also adjust receiving store
    if (mov.type === 'TRANSFER_OUT' && mov.targetStoreId) {
      const recInv = await findInventory(mov.targetStoreId, mov.productId, mov.variantId);
      if (recInv) {
        await db.inventory.update(recInv.id, { quantity: recInv.quantity + Math.abs(mov.quantity) });
      } else {
        await db.inventory.add({
          id: `inv-${mov.targetStoreId}-${mov.productId}`,
          storeId: mov.targetStoreId,
          productId: mov.productId,
          quantity: Math.abs(mov.quantity),
          reservedQty: 0,
          location: 'Склад',
        });
      }
    }

    await refreshData();
  };

  const resetDatabase = async () => {
    await initDatabase(true);
    await refreshData();
    clearCart();
  };

  return (
    <POSContext.Provider
      value={{
        stores,
        currentStore,
        users,
        currentUser,
        currentShift,
        categories,
        products,
        variants,
        inventory,
        customers,
        heldCarts,
        orders,
        cart,
        selectedCustomer,
        orderDiscountPercent,
        settings,
        isOffline,
        isSyncing,
        activeTab,
        lastCompletedOrder,
        isReceiptModalOpen,
        setActiveTab,
        switchStore,
        switchUser,
        logout,
        updateSettings,
        setLanguage,
        setCurrency,
        toggleSound,
        toggleTheme,
        addToCart,
        addToCartByBarcode,
        updateCartItemQty,
        setCartItemQty,
        setCartItemDiscount,
        removeCartItem,
        clearCart,
        setOrderDiscountPercent,
        setSelectedCustomer,
        holdCurrentCart,
        restoreHeldCart,
        deleteHeldCart,
        openShift,
        closeShift,
        cashDrawerInOut,
        completeSale,
        refundOrder,
        saveProduct,
        deleteProduct,
        saveCategory,
        moveCategory,
        deleteCategory,
        saveCustomer,
        saveStockMovement,
        refreshData,
        resetDatabase,
        setLastCompletedOrder,
        setIsReceiptModalOpen,
        cartTotals,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
