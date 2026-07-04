import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'restaurantDetail' });
  return {
    title: `${t('title')} #${id}`,
    robots: { index: false, follow: false },
  };
}

export default function RestaurantDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
