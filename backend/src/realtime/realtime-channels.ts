export const realtimeChannels = {
  adminOrders: 'private:admin:orders',
  adminDrivers: 'private:admin:drivers',
  userNotifications: (userId: string) => `private:user:${userId}:notifications`,
  restaurant: (restaurantId: string) => `private:restaurant:${restaurantId}`,
  order: (orderId: string) => `private:order:${orderId}`,
  restaurantDriverChat: (orderId: string) => `private:order:${orderId}:restaurant-driver`,
  driver: (driverId: string) => `private:driver:${driverId}`,
} as const

export type FoodFlowRealtimeChannel = string
