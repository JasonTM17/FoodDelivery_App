import type { KnowledgeEntry } from '../rag/rag-document.types'

/**
 * English FAQ knowledge base for FoodFlow chatbot.
 */
export const FAQ_EN: KnowledgeEntry[] = [
  {
    docType: 'faq',
    locale: 'en',
    title: 'How to place an order on FoodFlow',
    content:
      'Open FoodFlow → select a restaurant → add items to your cart → tap "Order Now" → confirm your delivery address → choose a payment method → confirm. You will receive an in-app notification once the restaurant accepts your order.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'Estimated delivery time',
    content:
      'Average delivery time is 20–45 minutes depending on distance, restaurant preparation time, and driver availability. The app shows a real-time estimate after you place your order.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'How to track my order',
    content:
      'Go to "My Orders" → select the active order → view the live map showing your driver\'s location. You also receive automatic push notifications at each status change.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'Can I cancel my order?',
    content:
      'You can cancel for free within 2 minutes of placing the order, or before the restaurant confirms it. Once the restaurant starts preparing, cancellations must go through customer support.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'Supported payment methods',
    content:
      'FoodFlow supports: (1) FoodFlow Wallet — preloaded balance for instant checkout; (2) Cash on delivery (COD); (3) Bank transfer via SePay. International credit/debit cards are coming soon.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'FoodFlow refund policy',
    content:
      'Refunds are granted for: cancelled paid orders; items not matching their description; missing or wrong items; failed deliveries. Refunds go to your FoodFlow Wallet within 24 hours or to your bank account within 3–5 business days.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'How to request a refund',
    content:
      'Go to "My Orders" → select the order → "Report an Issue" → describe the problem and attach photos if needed. Alternatively, chat with the AI assistant and provide your order ID — it will automatically check refund eligibility.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'How delivery fees are calculated',
    content:
      'Delivery fees are based on the distance between the restaurant and your address. A base fee applies for the first 1–3 km, then a per-km rate. The exact fee is shown before you confirm your order.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'How to get free delivery',
    content:
      'Free delivery is available when: (1) you apply a free-shipping promo code; (2) your order meets a restaurant\'s minimum spend threshold; (3) you are a Gold or Platinum member with applicable rewards.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'FoodFlow loyalty points program',
    content:
      'Earn 1 point for every 10,000 VND spent. Points can be redeemed for discount vouchers, free delivery, or gifts. Points are valid for 12 months from the date earned.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'I received missing or wrong items',
    content:
      'Take a photo of your order → go to "My Orders" → "Report an Issue" → select "Missing item" or "Wrong item" → attach the photo. We will review and issue a refund or re-delivery within 24 hours.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'How to reset my password',
    content:
      'On the login screen → "Forgot password" → enter your registered email → check your inbox (including spam) for a reset link. The link expires after 60 minutes.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'Driver is unreachable or did not deliver',
    content:
      'If your driver does not answer after 5 minutes, report it under "My Orders" → "Report an Issue" → "Driver unreachable". The system will reassign a driver or process a full refund.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'FoodFlow app not opening or crashing',
    content:
      'Try: (1) Close and reopen the app; (2) Check your internet connection; (3) Update the app to the latest version; (4) Clear the app cache in device settings; (5) Restart your device. If the issue persists, contact support.',
  },
  {
    docType: 'faq',
    locale: 'en',
    title: 'How to apply a promo / discount code',
    content:
      'At checkout, enter your code in the "Promo Code / Coupon" field → tap "Apply". The discount shows immediately in your order total. Only one code can be used per order.',
  },
]
