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
