export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  user: AuthUser;
}

/** Payload of the realtime `driver:new_order` offer event. */
export interface DispatchOffer {
  orderId: string;
  offerToken: string;
  restaurantName?: string;
  restaurantAddress?: string;
  deliveryAddress?: string;
  orderTotal?: number;
  deliveryFee?: number;
  distanceKm?: number;
  timeoutSeconds?: number;
  surgeMultiplier?: number;
}

export type DriverOrderStatus =
  | 'driver_assigned'
  | 'driver_arriving_restaurant'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | string;

export interface DriverOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedOptions?: unknown;
}

export interface DriverOrder {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogoUrl?: string | null;
  restaurantPhone?: string | null;
  customerName: string;
  customerPhone?: string | null;
  items: DriverOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: DriverOrderStatus;
  driverId?: string | null;
  deliveryAddress: {
    label?: string | null;
    address: string;
    latitude: number;
    longitude: number;
  };
  paymentMethod: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string | null }>;
  restaurantLatitude: number;
  restaurantLongitude: number;
  estimatedDeliveryTimeMinutes?: number | null;
  routePhase?: 'pickup' | 'dropoff' | 'none' | string;
  routePolyline?: string | null;
}

export interface DriverEarnings {
  totalEarnings: number;
  totalOrders: number;
  averagePerOrder: number;
  entries: Array<{
    orderId: string;
    orderCode: string;
    restaurantName: string;
    amount: number;
    completedAt: string;
  }>;
}

export interface DriverEarningsSummary {
  period: string;
  totalVnd: number;
  tripCount: number;
  avgPerTrip: number;
  byDay: Array<{ date: string; amount: number; tripCount: number }>;
}

export interface DriverRatings {
  reviews: Array<{
    id: string;
    customerName: string;
    customerAvatarUrl?: string | null;
    rating: number;
    comment?: string | null;
    date: string;
    orderId: string;
    orderCode: string;
  }>;
  stats: {
    average: number;
    totalReviews: number;
    distribution: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
  };
  hasMore: boolean;
}

export interface RealtimeTokenResponse {
  provider: 'supabase';
  token: string;
  expiresAt: string;
  channels: string[];
}
