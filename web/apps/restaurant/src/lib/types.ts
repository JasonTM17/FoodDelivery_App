export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  logo: string;
  coverImage: string;
  isActive: boolean;
  openingHours: OpeningHours;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  tableNumber: string | null;
  note: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  options: OrderItemOption[];
}

export interface OrderItemOption {
  name: string;
  value: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  options: MenuItemOption[];
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  type: 'single' | 'multi';
  required: boolean;
  choices: MenuItemChoice[];
}

export interface MenuItemChoice {
  id: string;
  name: string;
  price: number;
}

export interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyRevenue: DailyRevenue[];
  topSellingItems: TopSellingItem[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopSellingItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface AuthResponse {
  token: string;
  restaurant: Restaurant;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface OrderStatusTimeline {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
  icon: string;
}

export const ORDER_STATUSES: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Chờ xác nhận' },
  { status: 'confirmed', label: 'Đã xác nhận' },
  { status: 'preparing', label: 'Đang chuẩn bị' },
  { status: 'ready', label: 'Sẵn sàng' },
  { status: 'delivering', label: 'Đang giao' },
  { status: 'delivered', label: 'Đã giao' },
];
