import { redirect } from 'next/navigation';

/**
 * Locale root — redirect to the orders page.
 * The orders route is not yet locale-prefixed, so we land there directly.
 */
export default function LocaleRootPage() {
  redirect('/orders');
}
