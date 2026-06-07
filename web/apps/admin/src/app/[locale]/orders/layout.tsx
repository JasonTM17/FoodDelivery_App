import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'orders' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
