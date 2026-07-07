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

export function parseRestaurantReviewsResponse(data: unknown): RestaurantReview[] {
  if (!data || typeof data !== 'object') {
    throw new Error('REVIEWS_CONTRACT_MISMATCH');
  }

  const response = data as Record<string, unknown>;
  if (!Array.isArray(response.reviews)) {
    throw new Error('REVIEWS_CONTRACT_MISMATCH');
  }

  return response.reviews.map(parseRestaurantReview);
}

function parseRestaurantReview(value: unknown): RestaurantReview {
  if (!value || typeof value !== 'object') {
    throw new Error('REVIEWS_CONTRACT_MISMATCH');
  }

  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    typeof row.customerName !== 'string' ||
    typeof row.customerInitial !== 'string' ||
    typeof row.rating !== 'number' ||
    !Number.isFinite(row.rating) ||
    row.rating < 1 ||
    row.rating > 5 ||
    typeof row.comment !== 'string' ||
    !(typeof row.reply === 'string' || row.reply === null) ||
    typeof row.createdAt !== 'string' ||
    typeof row.orderId !== 'string'
  ) {
    throw new Error('REVIEWS_CONTRACT_MISMATCH');
  }

  return {
    id: row.id,
    customerName: row.customerName,
    customerInitial: row.customerInitial,
    rating: row.rating,
    comment: row.comment,
    reply: row.reply,
    createdAt: row.createdAt,
    orderId: row.orderId,
  };
}
