import { redirect } from 'next/navigation';

/**
 * Locale root redirects to the main dashboard while preserving the locale segment.
 */
export default function LocaleRootPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/overview`);
}
