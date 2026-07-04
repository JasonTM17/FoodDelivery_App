import { redirect } from 'next/navigation';

/**
 * Locale root redirects to the main dashboard while preserving the locale segment.
 */
export default async function LocaleRootPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/overview`);
}
