import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { runId, locale },
}: {
  params: { runId: string; locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'aiMonitorDetail' });
  return {
    title: `${t('title')} #${runId}`,
    robots: { index: false, follow: false },
  };
}

export default function AiMonitorDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
