export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export type PaymentMethod = 'CASH' | 'CARD' | 'BONUSES' | 'MIXED' | 'QR' | 'TRANSFER';

export type OrderStatus = 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'HELD' | 'CANCELLED';

export type MovementType = 
  | 'RECEIPT'       // Приход товара
  | 'WRITE_OFF'     // Списание
  | 'TRANSFER_IN'   // Перемещение входящее
  | 'TRANSFER_OUT'  // Перемещение исходящее
  | 'INVENTORY_ADJ' // Инвентаризация
  | 'SALE'          // Продажа
  | 'RETURN';       // Возврат

export type ShiftStatus = 'OPEN' | 'CLOSED';

export type StoreType = 'GROCERY' | 'CLOTHING' | 'ELECTRONICS' | 'COSMETICS' | 'GENERAL';

export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  taxNumber: string; // ИНН
  currency: string;  // RUB, USD, EUR, etc.
  type: StoreType;
  defaultTaxRate: number; // %
  headerNotice?: string;
  footerNotice?: string;
}

export interface User {
  id: string;
  storeId?: string;
  name: string;
  email: string;
  pinCode: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  color?: string;
  icon?: string;
  order: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g. "Синий / XL" or "0.5л"
  sku: string;
  barcode?: string;
  costPrice?: number;
  salePrice: number;
  attributes?: Record<string, string>;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  unit: string; // шт, кг, л, уп
  costPrice: number;
  salePrice: number;
  minStockAlert: number;
  hasVariants: boolean;
  image?: string;
  taxRate: number; // 0, 10, 20
  active: boolean;
  variants?: ProductVariant[];
}

export interface InventoryItem {
  id: string;
  storeId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reservedQty: number;
  location?: string; // Полка / Стеллаж
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cardNumber?: string;
  bonusPoints: number;
  discountPercent: number;
  totalSpent: number;
}

export interface CartItem {
  id: string; // unique item id in cart
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  barcode?: string;
  unit: string;
  costPrice: number;
  originalPrice: number;
  unitPrice: number; // after position discount
  quantity: number;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
}

export interface HeldCart {
  id: string;
  number: number;
  createdAt: number;
  name?: string;
  items: CartItem[];
  customer?: Customer;
  orderDiscountPercent: number;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  referenceCode?: string;
  createdAt: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discountAmt: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  receiptNumber: string;
  storeId: string;
  userId: string;
  userName: string;
  shiftId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  discountRate: number; // %
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  bonusApplied: number;
  bonusEarned: number;
  paymentMethod: PaymentMethod;
  payments: PaymentRecord[];
  items: OrderItem[];
  notes?: string;
  createdAt: number;
  refundedAt?: number;
  refundReason?: string;
}

export interface Shift {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  openedAt: number;
  closedAt?: number;
  status: ShiftStatus;
  openingCash: number;
  closingCash?: number;
  cashDrawerIn: number;  // Внесения
  cashDrawerOut: number; // Выемки
  totalSalesCash: number;
  totalSalesCard: number;
  totalSalesBonus: number;
  totalSales: number;
  ordersCount: number;
  returnsCount: number;
  returnsTotal: number;
  notes?: string;
}

export interface StockMovement {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  targetStoreId?: string; // для перемещений
  reference?: string;     // Накладная или номер чека
  notes?: string;
  createdAt: number;
  userName?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  timestamp: number;
}

export interface POSSettings {
  storeId: string;
  currency: string;
  language: 'ru' | 'en';
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  printerWidth: '58mm' | '80mm';
  autoPrintReceipt: boolean;
  openCashDrawerOnSale: boolean;
  scannerSound: boolean;
}
