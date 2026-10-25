import Dexie, { type Table } from 'dexie';
import type {
  Store,
  User,
  Category,
  Product,
  ProductVariant,
  InventoryItem,
  Order,
  OrderItem,
  Shift,
  Customer,
  StockMovement,
  HeldCart,
  POSSettings,
  AuditLog,
} from '../types';

export class OmniPOSDatabase extends Dexie {
  stores!: Table<Store, string>;
  users!: Table<User, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  variants!: Table<ProductVariant, string>;
  inventory!: Table<InventoryItem, string>;
  orders!: Table<Order, string>;
  orderItems!: Table<OrderItem, string>;
  shifts!: Table<Shift, string>;
  customers!: Table<Customer, string>;
  stockMovements!: Table<StockMovement, string>;
  heldCarts!: Table<HeldCart, string>;
  settings!: Table<POSSettings, string>;
  auditLogs!: Table<AuditLog, string>;

  constructor() {
    super('OmniPOS_DB');
    this.version(1).stores({
      stores: 'id, code, name',
      users: 'id, email, pinCode, role, storeId',
      categories: 'id, slug, parentId, order',
      products: 'id, categoryId, sku, barcode, active',
      variants: 'id, productId, sku, barcode',
      inventory: 'id, [storeId+productId], storeId, productId',
      orders: 'id, receiptNumber, storeId, userId, shiftId, customerId, status, createdAt',
      orderItems: 'id, orderId, productId',
      shifts: 'id, storeId, userId, status, openedAt',
      customers: 'id, phone, cardNumber, name',
      stockMovements: 'id, storeId, productId, type, createdAt',
      heldCarts: 'id, number, createdAt',
      settings: 'storeId',
      auditLogs: 'id, userId, timestamp, action',
    });
  }
}

export const db = new OmniPOSDatabase();

// Pre-defined demo stores
export const INITIAL_STORES: Store[] = [
  {
    id: 'store-1',
    name: 'OmniMarket «Флагман» (Продукты & Кафе)',
    code: 'MSK-01',
    address: 'ул. Тверская, д. 14, Москва',
    phone: '+7 (495) 123-45-67',
    taxNumber: '7701234567',
    currency: 'RUB',
    type: 'GROCERY',
    defaultTaxRate: 20,
    headerNotice: 'Добро пожаловать в OmniMarket!',
    footerNotice: 'Спасибо за покупку! Приходите к нам ещё.',
  },
  {
    id: 'store-2',
    name: 'OmniStyle «ТРЦ Европейский» (Одежда & Обувь)',
    code: 'MSK-02',
    address: 'пл. Киевского Вокзала, 2, Москва',
    phone: '+7 (495) 765-43-21',
    taxNumber: '7709876543',
    currency: 'RUB',
    type: 'CLOTHING',
    defaultTaxRate: 20,
    headerNotice: 'Бутик OmniStyle — Ваш стиль каждый день',
    footerNotice: 'Возврат и обмен в течение 14 дней при наличии чека.',
  },
  {
    id: 'store-3',
    name: 'OmniTech «Авиапарк» (Цифровая техника)',
    code: 'MSK-03',
    address: 'Ходынский бульвар, 4, Москва',
    phone: '+7 (495) 333-22-11',
    taxNumber: '7703332211',
    currency: 'RUB',
    type: 'ELECTRONICS',
    defaultTaxRate: 20,
    headerNotice: 'OmniTech — Умные гаджеты и аксессуары',
    footerNotice: 'Гарантийное обслуживание 12 месяцев.',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Алексей Романов (Администратор)',
    email: 'admin@pos.local',
    pinCode: '0000',
    role: 'ADMIN',
    active: true,
  },
  {
    id: 'user-manager',
    name: 'Елена Смирнова (Управляющий)',
    email: 'manager@pos.local',
    pinCode: '1111',
    role: 'MANAGER',
    storeId: 'store-1',
    active: true,
  },
  {
    id: 'user-cashier-1',
    name: 'Анна Воронова (Кассир #1)',
    email: 'cashier1@pos.local',
    pinCode: '1234',
    role: 'CASHIER',
    storeId: 'store-1',
    active: true,
  },
  {
    id: 'user-cashier-2',
    name: 'Дмитрий Соколов (Кассир #2)',
    email: 'cashier2@pos.local',
    pinCode: '4321',
    role: 'CASHIER',
    storeId: 'store-1',
    active: true,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Михаил Иванов',
    phone: '+7 (916) 111-22-33',
    email: 'ivanov@example.com',
    cardNumber: 'VIP-7701',
    bonusPoints: 450,
    discountPercent: 5,
    totalSpent: 48200,
  },
  {
    id: 'cust-2',
    name: 'Ольга Кузнецова',
    phone: '+7 (925) 444-55-66',
    email: 'olga.k@example.com',
    cardNumber: 'VIP-7702',
    bonusPoints: 1200,
    discountPercent: 10,
    totalSpent: 112500,
  },
  {
    id: 'cust-3',
    name: 'Артем Васильев',
    phone: '+7 (903) 777-88-99',
    cardNumber: 'STD-1049',
    bonusPoints: 180,
    discountPercent: 3,
    totalSpent: 14900,
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-all', name: 'Все товары', slug: 'all', order: 0, color: '#475569', icon: 'LayoutGrid' },
  { id: 'cat-bakery', name: 'Хлеб & Выпечка', slug: 'bakery', order: 1, color: '#f59e0b', icon: 'Wheat' },
  { id: 'cat-dairy', name: 'Молочные продукты', slug: 'dairy', order: 2, color: '#38bdf8', icon: 'Milk' },
  { id: 'cat-beverages', name: 'Напитки & Кофе', slug: 'beverages', order: 3, color: '#06b6d4', icon: 'Coffee' },
  { id: 'cat-grocery', name: 'Бакалея & Сладости', slug: 'grocery', order: 4, color: '#ec4899', icon: 'Candy' },
  { id: 'cat-fruits', name: 'Овощи & Фрукты', slug: 'fruits', order: 5, color: '#10b981', icon: 'Apple' },
  { id: 'cat-apparel', name: 'Одежда & Обувь', slug: 'apparel', order: 6, color: '#8b5cf6', icon: 'Shirt' },
  { id: 'cat-tech', name: 'Гаджеты & Электроника', slug: 'tech', order: 7, color: '#6366f1', icon: 'Smartphone' },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Продукты
  {
    id: 'prod-1',
    categoryId: 'cat-bakery',
    name: 'Ремесленный багет на закваске',
    sku: 'BGT-001',
    barcode: '460700100101',
    description: 'Хрустящий французский багет ручной работы',
    unit: 'шт',
    costPrice: 45,
    salePrice: 120,
    minStockAlert: 10,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80',
    taxRate: 10,
    active: true,
  },
  {
    id: 'prod-2',
    categoryId: 'cat-bakery',
    name: 'Круассан с миндальным кремом',
    sku: 'CRN-002',
    barcode: '460700100102',
    description: 'Свежая слоеная выпечка с лепестками миндаля',
    unit: 'шт',
    costPrice: 65,
    salePrice: 180,
    minStockAlert: 8,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-3',
    categoryId: 'cat-dairy',
    name: 'Молоко фермерское 3.2%, 1л',
    sku: 'MLK-003',
    barcode: '460700100103',
    description: 'Цельное пастеризованное молоко',
    unit: 'шт',
    costPrice: 60,
    salePrice: 110,
    minStockAlert: 15,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80',
    taxRate: 10,
    active: true,
  },
  {
    id: 'prod-4',
    categoryId: 'cat-dairy',
    name: 'Сыр Пармезан выдержанный 12 мес',
    sku: 'CHS-004',
    barcode: '460700100104',
    description: 'Твердый итальянский сыр кусковой 200г',
    unit: 'уп',
    costPrice: 280,
    salePrice: 490,
    minStockAlert: 5,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=400&q=80',
    taxRate: 10,
    active: true,
  },
  {
    id: 'prod-5',
    categoryId: 'cat-beverages',
    name: 'Кофе зерновой Эфиопия Иргачеффе 250г',
    sku: 'COF-005',
    barcode: '460700100105',
    description: '100% Арабика, ноты бергамота и персика',
    unit: 'уп',
    costPrice: 450,
    salePrice: 850,
    minStockAlert: 10,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-6',
    categoryId: 'cat-beverages',
    name: 'Капучино на вынос (Большой, 400мл)',
    sku: 'CAP-006',
    barcode: '460700100106',
    description: 'Свежесваренный эспрессо с шелковистой молочной пенкой',
    unit: 'шт',
    costPrice: 40,
    salePrice: 240,
    minStockAlert: 50,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1572442388796-11668ba67e53?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-7',
    categoryId: 'cat-beverages',
    name: 'Вода минеральная San Pellegrino 0.75л',
    sku: 'WTR-007',
    barcode: '460700100107',
    description: 'Газированная природная минеральная вода в стекле',
    unit: 'шт',
    costPrice: 110,
    salePrice: 220,
    minStockAlert: 20,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-8',
    categoryId: 'cat-fruits',
    name: 'Бананы Эквадор Премиум',
    sku: 'BNN-008',
    barcode: '460700100108',
    description: 'Спелые отборные бананы',
    unit: 'кг',
    costPrice: 85,
    salePrice: 140,
    minStockAlert: 20,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    taxRate: 10,
    active: true,
  },
  {
    id: 'prod-9',
    categoryId: 'cat-fruits',
    name: 'Авокадо Хасс спелое (2 шт в уп)',
    sku: 'AVO-009',
    barcode: '460700100109',
    description: 'Маслянистый сорт Ready to Eat',
    unit: 'уп',
    costPrice: 180,
    salePrice: 320,
    minStockAlert: 6,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-10',
    categoryId: 'cat-grocery',
    name: 'Шоколад темный Lindt Excellence 85%, 100г',
    sku: 'LND-010',
    barcode: '460700100110',
    description: 'Швейцарский горький шоколад',
    unit: 'шт',
    costPrice: 140,
    salePrice: 260,
    minStockAlert: 12,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-11',
    categoryId: 'cat-grocery',
    name: 'Оливковое масло Extra Virgin 500мл',
    sku: 'OIL-011',
    barcode: '460700100111',
    description: 'Холодный отжим, Греция Каламата',
    unit: 'шт',
    costPrice: 420,
    salePrice: 790,
    minStockAlert: 5,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    taxRate: 10,
    active: true,
  },

  // Одежда с вариантами (размеры и цвета)
  {
    id: 'prod-12',
    categoryId: 'cat-apparel',
    name: 'Футболка базовый оверсайз Heavy Cotton',
    sku: 'TSH-012',
    barcode: '460700100112',
    description: '100% премиум хлопок плотностью 240г/м2',
    unit: 'шт',
    costPrice: 600,
    salePrice: 1890,
    minStockAlert: 10,
    hasVariants: true,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-13',
    categoryId: 'cat-apparel',
    name: 'Худи унисекс с начесом',
    sku: 'HUD-013',
    barcode: '460700100113',
    description: 'Теплый объемный худи с карманом-кенгуру',
    unit: 'шт',
    costPrice: 1400,
    salePrice: 3900,
    minStockAlert: 8,
    hasVariants: true,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-14',
    categoryId: 'cat-apparel',
    name: 'Кепка бейсболка Minimalist',
    sku: 'CAP-014',
    barcode: '460700100114',
    description: 'Хлопковая кепка с регулируемой застежкой',
    unit: 'шт',
    costPrice: 400,
    salePrice: 1200,
    minStockAlert: 5,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },

  // Электроника
  {
    id: 'prod-15',
    categoryId: 'cat-tech',
    name: 'Беспроводные наушники TWS AirPro Gen 2',
    sku: 'TWS-015',
    barcode: '460700100115',
    description: 'Активное шумоподавление ANC, до 30 часов работы',
    unit: 'шт',
    costPrice: 2200,
    salePrice: 4990,
    minStockAlert: 4,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-16',
    categoryId: 'cat-tech',
    name: 'Портативный аккумулятор PowerBank 20000 mAh 65W',
    sku: 'PWR-016',
    barcode: '460700100116',
    description: 'Быстрая зарядка ноутбуков и смартфонов Power Delivery',
    unit: 'шт',
    costPrice: 1600,
    salePrice: 3490,
    minStockAlert: 5,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1609592424368-23c21d0a5146?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
  {
    id: 'prod-17',
    categoryId: 'cat-tech',
    name: 'Кабель Type-C to Type-C 100W оплетка 1.5м',
    sku: 'CBL-017',
    barcode: '460700100117',
    description: 'Прочный нейлоновый кабель с защитой от перегиба',
    unit: 'шт',
    costPrice: 190,
    salePrice: 690,
    minStockAlert: 15,
    hasVariants: false,
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=400&q=80',
    taxRate: 20,
    active: true,
  },
];

export const INITIAL_VARIANTS: ProductVariant[] = [
  // Футболка
  {
    id: 'var-12-s-blk',
    productId: 'prod-12',
    name: 'Черный / S',
    sku: 'TSH-012-BLK-S',
    barcode: '460700100201',
    costPrice: 600,
    salePrice: 1890,
    attributes: { color: 'Черный', size: 'S' },
  },
  {
    id: 'var-12-m-blk',
    productId: 'prod-12',
    name: 'Черный / M',
    sku: 'TSH-012-BLK-M',
    barcode: '460700100202',
    costPrice: 600,
    salePrice: 1890,
    attributes: { color: 'Черный', size: 'M' },
  },
  {
    id: 'var-12-l-blk',
    productId: 'prod-12',
    name: 'Черный / L',
    sku: 'TSH-012-BLK-L',
    barcode: '460700100203',
    costPrice: 600,
    salePrice: 1890,
    attributes: { color: 'Черный', size: 'L' },
  },
  {
    id: 'var-12-m-wht',
    productId: 'prod-12',
    name: 'Белый / M',
    sku: 'TSH-012-WHT-M',
    barcode: '460700100204',
    costPrice: 600,
    salePrice: 1890,
    attributes: { color: 'Белый', size: 'M' },
  },
  {
    id: 'var-12-l-wht',
    productId: 'prod-12',
    name: 'Белый / L',
    sku: 'TSH-012-WHT-L',
    barcode: '460700100205',
    costPrice: 600,
    salePrice: 1890,
    attributes: { color: 'Белый', size: 'L' },
  },

  // Худи
  {
    id: 'var-13-m-grn',
    productId: 'prod-13',
    name: 'Хаки / M',
    sku: 'HUD-013-KHK-M',
    barcode: '460700100211',
    costPrice: 1400,
    salePrice: 3900,
    attributes: { color: 'Хаки', size: 'M' },
  },
  {
    id: 'var-13-l-grn',
    productId: 'prod-13',
    name: 'Хаки / L',
    sku: 'HUD-013-KHK-L',
    barcode: '460700100212',
    costPrice: 1400,
    salePrice: 3900,
    attributes: { color: 'Хаки', size: 'L' },
  },
  {
    id: 'var-13-l-blk',
    productId: 'prod-13',
    name: 'Графит / L',
    sku: 'HUD-013-GRA-L',
    barcode: '460700100213',
    costPrice: 1400,
    salePrice: 3900,
    attributes: { color: 'Графит', size: 'L' },
  },
];

// Initialize database with rich data if not yet initialized
export async function initDatabase(forceReset = false) {
  const storeCount = await db.stores.count();
  if (storeCount > 0 && !forceReset) {
    return;
  }

  if (forceReset) {
    await db.stores.clear();
    await db.users.clear();
    await db.categories.clear();
    await db.products.clear();
    await db.variants.clear();
    await db.inventory.clear();
    await db.orders.clear();
    await db.orderItems.clear();
    await db.shifts.clear();
    await db.customers.clear();
    await db.stockMovements.clear();
    await db.heldCarts.clear();
    await db.settings.clear();
    await db.auditLogs.clear();
  }

  // Insert initial seed
  await db.stores.bulkAdd(INITIAL_STORES);
  await db.users.bulkAdd(INITIAL_USERS);
  await db.categories.bulkAdd(INITIAL_CATEGORIES);
  await db.customers.bulkAdd(INITIAL_CUSTOMERS);
  await db.products.bulkAdd(INITIAL_PRODUCTS);
  await db.variants.bulkAdd(INITIAL_VARIANTS);

  // Seed inventory for Store 1 and Store 2
  const inventoryList: InventoryItem[] = [];
  const movements: StockMovement[] = [];

  for (const store of INITIAL_STORES) {
    for (const prod of INITIAL_PRODUCTS) {
      if (prod.hasVariants) {
        const prodVariants = INITIAL_VARIANTS.filter((v) => v.productId === prod.id);
        for (const variant of prodVariants) {
          const qty = store.id === 'store-1' ? 18 : 10;
          inventoryList.push({
            id: `inv-${store.id}-${variant.id}`,
            storeId: store.id,
            productId: prod.id,
            variantId: variant.id,
            quantity: qty,
            reservedQty: 0,
            location: 'Секция A-2',
          });
          movements.push({
            id: `mov-init-${store.id}-${variant.id}`,
            storeId: store.id,
            productId: prod.id,
            productName: prod.name,
            variantId: variant.id,
            variantName: variant.name,
            type: 'RECEIPT',
            quantity: qty,
            unitCost: variant.costPrice ?? prod.costPrice,
            reference: 'НАКЛАДНАЯ-001',
            notes: 'Начальный ввод остатков',
            createdAt: Date.now() - 86400000 * 3,
            userName: 'Алексей Романов',
          });
        }
      } else {
        const qty = store.id === 'store-1' ? 35 : 15;
        inventoryList.push({
          id: `inv-${store.id}-${prod.id}`,
          storeId: store.id,
          productId: prod.id,
          quantity: qty,
          reservedQty: 0,
          location: 'Секция C-1',
        });
        movements.push({
          id: `mov-init-${store.id}-${prod.id}`,
          storeId: store.id,
          productId: prod.id,
          productName: prod.name,
          type: 'RECEIPT',
          quantity: qty,
          unitCost: prod.costPrice,
          reference: 'НАКЛАДНАЯ-001',
          notes: 'Начальный ввод остатков',
          createdAt: Date.now() - 86400000 * 3,
          userName: 'Алексей Романов',
        });
      }
    }
  }

  await db.inventory.bulkAdd(inventoryList);
  await db.stockMovements.bulkAdd(movements);

  // Create initial Open Shift for user-cashier-1 in store-1
  const initialShift: Shift = {
    id: 'shift-today',
    storeId: 'store-1',
    userId: 'user-cashier-1',
    userName: 'Анна Воронова (Кассир #1)',
    openedAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
    status: 'OPEN',
    openingCash: 5000,
    cashDrawerIn: 0,
    cashDrawerOut: 0,
    totalSalesCash: 1240,
    totalSalesCard: 5680,
    totalSalesBonus: 180,
    totalSales: 7100,
    ordersCount: 3,
    returnsCount: 0,
    returnsTotal: 0,
    notes: 'Утренняя смена',
  };
  await db.shifts.add(initialShift);

  // Seed sample completed orders for instant rich reporting
  const sampleOrders: Order[] = [
    {
      id: 'order-101',
      receiptNumber: '0001-20261025',
      storeId: 'store-1',
      userId: 'user-cashier-1',
      userName: 'Анна Воронова',
      shiftId: 'shift-today',
      customerId: 'cust-1',
      customerName: 'Михаил Иванов',
      customerPhone: '+7 (916) 111-22-33',
      status: 'COMPLETED',
      subtotal: 1210,
      discountAmount: 60,
      discountRate: 5,
      taxAmount: 202,
      totalAmount: 1150,
      paidAmount: 1150,
      changeAmount: 0,
      bonusApplied: 0,
      bonusEarned: 35,
      paymentMethod: 'CARD',
      payments: [
        {
          id: 'pay-1',
          orderId: 'order-101',
          method: 'CARD',
          amount: 1150,
          referenceCode: 'SBR-889921',
          createdAt: Date.now() - 1000 * 60 * 180,
        },
      ],
      items: [
        {
          id: 'oi-1',
          orderId: 'order-101',
          productId: 'prod-5',
          productName: 'Кофе зерновой Эфиопия Иргачеффе 250г',
          sku: 'COF-005',
          unitPrice: 850,
          costPrice: 450,
          quantity: 1,
          discountAmt: 42.5,
          totalPrice: 807.5,
        },
        {
          id: 'oi-2',
          orderId: 'order-101',
          productId: 'prod-2',
          productName: 'Круассан с миндальным кремом',
          sku: 'CRN-002',
          unitPrice: 180,
          costPrice: 65,
          quantity: 2,
          discountAmt: 17.5,
          totalPrice: 342.5,
        },
      ],
      createdAt: Date.now() - 1000 * 60 * 180,
    },
    {
      id: 'order-102',
      receiptNumber: '0002-20261025',
      storeId: 'store-1',
      userId: 'user-cashier-1',
      userName: 'Анна Воронова',
      shiftId: 'shift-today',
      status: 'COMPLETED',
      subtotal: 1240,
      discountAmount: 0,
      discountRate: 0,
      taxAmount: 207,
      totalAmount: 1240,
      paidAmount: 2000,
      changeAmount: 760,
      bonusApplied: 0,
      bonusEarned: 0,
      paymentMethod: 'CASH',
      payments: [
        {
          id: 'pay-2',
          orderId: 'order-102',
          method: 'CASH',
          amount: 1240,
          createdAt: Date.now() - 1000 * 60 * 95,
        },
      ],
      items: [
        {
          id: 'oi-3',
          orderId: 'order-102',
          productId: 'prod-1',
          productName: 'Ремесленный багет на закваске',
          sku: 'BGT-001',
          unitPrice: 120,
          costPrice: 45,
          quantity: 2,
          discountAmt: 0,
          totalPrice: 240,
        },
        {
          id: 'oi-4',
          orderId: 'order-102',
          productId: 'prod-4',
          productName: 'Сыр Пармезан выдержанный 12 мес',
          sku: 'CHS-004',
          unitPrice: 490,
          costPrice: 280,
          quantity: 2,
          discountAmt: 0,
          totalPrice: 980,
        },
        {
          id: 'oi-5',
          orderId: 'order-102',
          productId: 'prod-7',
          productName: 'Вода минеральная San Pellegrino 0.75л',
          sku: 'WTR-007',
          unitPrice: 220,
          costPrice: 110,
          quantity: 1,
          discountAmt: 0,
          totalPrice: 220,
        },
      ],
      createdAt: Date.now() - 1000 * 60 * 95,
    },
    {
      id: 'order-103',
      receiptNumber: '0003-20261025',
      storeId: 'store-1',
      userId: 'user-cashier-1',
      userName: 'Анна Воронова',
      shiftId: 'shift-today',
      customerId: 'cust-2',
      customerName: 'Ольга Кузнецова',
      status: 'COMPLETED',
      subtotal: 4990,
      discountAmount: 280,
      discountRate: 0,
      taxAmount: 785,
      totalAmount: 4710,
      paidAmount: 4710,
      changeAmount: 0,
      bonusApplied: 180,
      bonusEarned: 135,
      paymentMethod: 'MIXED',
      payments: [
        {
          id: 'pay-3',
          orderId: 'order-103',
          method: 'BONUSES',
          amount: 180,
          createdAt: Date.now() - 1000 * 60 * 30,
        },
        {
          id: 'pay-4',
          orderId: 'order-103',
          method: 'CARD',
          amount: 4530,
          referenceCode: 'TNK-992100',
          createdAt: Date.now() - 1000 * 60 * 30,
        },
      ],
      items: [
        {
          id: 'oi-6',
          orderId: 'order-103',
          productId: 'prod-15',
          productName: 'Беспроводные наушники TWS AirPro Gen 2',
          sku: 'TWS-015',
          unitPrice: 4990,
          costPrice: 2200,
          quantity: 1,
          discountAmt: 100,
          totalPrice: 4890,
        },
      ],
      createdAt: Date.now() - 1000 * 60 * 30,
    },
  ];

  await db.orders.bulkAdd(sampleOrders);

  // Settings
  const defaultSettings: POSSettings = {
    storeId: 'store-1',
    currency: 'RUB',
    language: 'ru',
    soundEnabled: true,
    theme: 'light',
    printerWidth: '80mm',
    autoPrintReceipt: true,
    openCashDrawerOnSale: true,
    scannerSound: true,
  };
  await db.settings.put(defaultSettings);

  // Audit log
  await db.auditLogs.add({
    id: 'audit-init',
    action: 'SYSTEM_BOOT',
    entity: 'SYSTEM',
    details: 'Инициализация базы данных OmniPOS с тестовым каталогом',
    timestamp: Date.now(),
    userName: 'Система',
  });
}
