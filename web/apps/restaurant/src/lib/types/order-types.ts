export type OrderStatus =
  | 'created'
  | 'pending_payment'
  | 'paid'
  | 'restaurant_pending'
  | 'restaurant_accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'driver_assigned'
  | 'driver_arriving_restaurant'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

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

export interface OrderStatusTimeline {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
  icon: string;
}

export const LEGACY_ORDER_STATUSES = [
  { status: 'pending', label: 'Chờ xác nhận' },
  { status: 'confirmed', label: 'Đã xác nhận' },
  { status: 'preparing', label: 'Đang chuẩn bị' },
  { status: 'ready', label: 'Sẵn sàng' },
  { status: 'delivering', label: 'Đang giao' },
  { status: 'delivered', label: 'Đã giao' },
];

export const ORDER_STATUSES: { status: OrderStatus; label: string }[] = [
  { status: 'restaurant_pending', label: 'Chờ xác nhận' },
  { status: 'restaurant_accepted', label: 'Đã xác nhận' },
  { status: 'preparing', label: 'Đang chuẩn bị' },
  { status: 'ready_for_pickup', label: 'Sẵn sàng lấy món' },
  { status: 'delivering', label: 'Đang giao' },
  { status: 'delivered', label: 'Đã giao' },
];
