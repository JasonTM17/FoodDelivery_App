import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'restaurantDetail' });
  return {
    title: `${t('title')} #${id}`,
    robots: { index: false, follow: false },
  };
}

export default function RestaurantDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
