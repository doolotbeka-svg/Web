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

    // v2: remove the demo catalog, sample orders and the manager role from existing databases
    this.version(2).stores({}).upgrade(async (tx) => {
      await Promise.all(
        ['products', 'variants', 'inventory', 'stockMovements', 'heldCarts'].map((t) => tx.table(t).clear())
      );
      await tx.table('orders').bulkDelete(['order-101', 'order-102', 'order-103']);
      await tx.table('users').where('role').equals('MANAGER').delete();
      await tx.table('shifts').where('id').equals('shift-today').modify((s: Shift) => {
        s.totalSalesCash = Math.max(0, s.totalSalesCash - 1240);
        s.totalSalesCard = Math.max(0, s.totalSalesCard - 5680);
        s.totalSalesBonus = Math.max(0, s.totalSalesBonus - 180);
        s.totalSales = Math.max(0, s.totalSales - 7100);
        s.ordersCount = Math.max(0, s.ordersCount - 3);
      });
    });

    // v3: remove all product categories except the built-in "all products" filter
    this.version(3).stores({}).upgrade(async (tx) => {
      await tx.table('categories').where('id').notEqual('cat-all').delete();
      await tx.table('products').toCollection().modify((p: Product) => {
        p.categoryId = 'cat-all';
      });
    });

    // v4: administrator PIN 7777
    this.version(4).stores({}).upgrade(async (tx) => {
      await tx.table('users').where('role').equals('ADMIN').modify((u: User) => {
        u.pinCode = '7777';
      });
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
    pinCode: '7777',
    role: 'ADMIN',
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
];

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
    totalSalesCash: 0,
    totalSalesCard: 0,
    totalSalesBonus: 0,
    totalSales: 0,
    ordersCount: 0,
    returnsCount: 0,
    returnsTotal: 0,
    notes: 'Утренняя смена',
  };
  await db.shifts.add(initialShift);

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
    details: 'Инициализация базы данных OmniPOS с пустым каталогом',
    timestamp: Date.now(),
    userName: 'Система',
  });
}
