import { redirect } from 'next/navigation';

/**
 * Locale root — redirect to the main dashboard.
 * The overview route is not yet locale-prefixed, so we land there directly.
 */
export default function LocaleRootPage() {
  redirect('/overview');
}
