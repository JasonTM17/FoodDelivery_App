import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'orders' });
  return {
    title: t('title'),
  };
}

export default function OrdersLocaleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
