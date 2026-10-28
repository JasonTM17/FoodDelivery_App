export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  user: AuthUser;
}

export interface Address {
  id: string;
  label: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

export type Paged<T> = PagedResult<T>;

export interface NearbyRestaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address_line: string;
  district: string | null;
  dist_km: number;
  rating: number;
  total_reviews: number;
  price_range: string;
  cuisine_types: string[];
  prep_time_avg_minutes: number;
  is_open: boolean;
}

export interface SearchRestaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  addressLine: string;
  district: string | null;
  city?: string | null;
  cuisineTypes: string[];
  priceRange: string;
  rating: number | string;
  totalReviews: number;
  isOpen: boolean;
  prepTimeAvgMinutes: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface OpeningHour {
  dayOfWeek: number;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed?: boolean;
}

export interface RestaurantDetail {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  addressLine: string;
  district?: string | null;
  city?: string | null;
  phone?: string | null;
  rating?: number | string;
  totalReviews?: number;
  priceRange?: string;
  cuisineTypes?: string[];
  prepTimeAvgMinutes?: number;
  minOrderAmount?: number | string;
  isOpen: boolean;
  openingHours?: OpeningHour[];
}

export interface MenuOptionValue {
  id: string;
  value: string;
  priceModifier: number;
}

export interface MenuItemOption {
  id: string;
  name: string;
  isRequired: boolean;
  isMultiple: boolean;
  /** Legacy alias tolerated from older payloads. */
  maxSelections?: number;
  values: MenuOptionValue[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  isAvailable: boolean;
  isPopular: boolean;
  options: MenuItemOption[];
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface RestaurantMenu {
  categories: MenuCategory[];
}

export interface SelectedOption {
  optionId: string;
  valueId: string;
  optionName: string;
  valueName: string;
  priceModifier: number;
}

export interface ServerCartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number | string;
  notes?: string | null;
  selectedOptions?: unknown;
  menuItem?: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    basePrice: number | string;
    options?: Array<{
      id: string;
      name: string;
      isRequired: boolean;
      isMultiple: boolean;
      values: Array<{ id: string; value: string; priceModifier: number | string }>;
    }>;
  } | null;
}

export interface ServerCart {
  id?: string;
  restaurantId: string | null;
  promotionCode: string | null;
  items: ServerCartItem[];
}

export interface OrderItemView {
  id?: string;
  menuItemId: string;
  name: string;
  nameSnapshot?: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  totalPrice?: number;
  lineTotal?: number;
  selectedOptions?: unknown;
  options?: string[];
}

export interface OrderStatusEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export interface CustomerOrder {
  id: string;
  customerId?: string;
  userId?: string;
  restaurantId: string;
  restaurantName?: string;
  restaurantLogoUrl?: string;
  restaurantPhone?: string;
  restaurant?: { id: string; name: string; logoUrl?: string | null; phone?: string | null };
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driver?: { id: string; fullName?: string | null; phone?: string | null } | null;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  note?: string;
  notes?: string;
  promoCode?: string;
  promotionCode?: string;
  deliveryAddress?: Record<string, unknown> | null;
  items: OrderItemView[];
  orderItems?: OrderItemView[];
  timeline?: OrderStatusEntry[];
  statusHistory?: OrderStatusEntry[];
  estimatedDeliveryTimeMinutes?: number;
  routePolyline?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  paymentIntent?: Record<string, unknown> | null;
}

export interface OrdersPage {
  orders: CustomerOrder[];
  meta: { page: number; limit: number; total: number; totalPages?: number };
}

export interface OrderTracking {
  orderId: string;
  status: string;
  routePhase: 'pickup' | 'dropoff' | 'none' | string;
  driverLocation: { lat: number; lng: number; lastUpdated: string } | null;
  etaMinutes: number | null;
  routePolyline: string | null;
}

/** Alias used by pages — a customer-scoped serialized order. */
export type Order = CustomerOrder;

/** POST /orders returns the same serialized contract as GET /orders/:id. */
export type CreateOrderResponse = CustomerOrder;

export interface ReviewsPage {
  items: RestaurantReview[];
  total: number;
  page: number;
  limit: number;
}

/** Normalized shape the RestaurantCard renders across search/nearby/detail. */
export interface CardRestaurant {
  id: string;
  name: string;
  imageUrl: string | null;
  addressLine: string;
  district?: string | null;
  cuisineTypes: string[];
  rating: number | null;
  isOpen: boolean;
}

export function toCardRestaurant(
  restaurant: SearchRestaurant | NearbyRestaurant | RestaurantDetail,
): CardRestaurant {
  const anyRestaurant = restaurant as unknown as Record<string, unknown>;
  const rating = Number(anyRestaurant.rating);
  return {
    id: restaurant.id,
    name: restaurant.name,
    imageUrl:
      (anyRestaurant.logoUrl as string | null) ??
      (anyRestaurant.logo_url as string | null) ??
      (anyRestaurant.coverImageUrl as string | null) ??
      null,
    addressLine:
      (anyRestaurant.addressLine as string) ?? (anyRestaurant.address_line as string) ?? '',
    district: (anyRestaurant.district as string | null) ?? null,
    cuisineTypes:
      (anyRestaurant.cuisineTypes as string[]) ?? (anyRestaurant.cuisine_types as string[]) ?? [],
    rating: Number.isFinite(rating) ? rating : null,
    isOpen: (anyRestaurant.isOpen ?? anyRestaurant.is_open) !== false,
  };
}

export interface DeliveryPricing {
  baseDeliveryFeeVnd: number;
}

export interface PromotionApplyResult {
  code: string;
  discount: number;
  subtotal: number;
}

export interface WalletSnapshot {
  balance: number;
  transactions: Array<{
    id: string;
    amountDelta: number;
    type: 'credit' | 'debit';
    reason: string;
    refId?: string;
    createdAt: string;
  }>;
}

export interface RestaurantReview {
  id: string;
  foodRating?: number | null;
  deliveryRating?: number | null;
  comment?: string | null;
  createdAt: string;
  customer: { id: string; fullName: string; avatarUrl?: string | null };
}
