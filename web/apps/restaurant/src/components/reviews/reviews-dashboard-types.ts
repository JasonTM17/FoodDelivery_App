export interface RestaurantReview {
  id: string;
  customerName: string;
  customerInitial: string;
  rating: number;
  comment: string;
  reply: string | null;
  createdAt: string;
  orderId: string;
}
