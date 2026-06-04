export interface NearbyRestaurant {
  id: string
  name: string
  slug: string
  logo_url: string
  address_line: string
  district: string
  dist_km: number
  rating: number
  total_reviews: number
  price_range: string
  cuisine_types: string[]
  prep_time_avg_minutes: number
  is_open: boolean
}

export interface RestaurantDetail {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  addressLine: string
  city: string
  district: string | null
  phone: string | null
  cuisineTypes: string[]
  priceRange: string
  rating: number
  totalReviews: number
  isOpen: boolean
  prepTimeAvgMinutes: number
  minOrderAmount: number
}
