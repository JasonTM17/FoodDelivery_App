import type { Restaurant } from './restaurant-types';

export interface AuthResponse {
  token: string;
  restaurant: Restaurant;
}

export interface ApiError {
  message: string;
  status: number;
}
