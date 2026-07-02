export interface Review {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  customerAvatar?: string;
  dishName: string;
  dishId?: string;
  photos: string[];
  repliedAt?: string;
  reply?: string;
  createdAt: string;
}

export interface RatingDistribution {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
}
