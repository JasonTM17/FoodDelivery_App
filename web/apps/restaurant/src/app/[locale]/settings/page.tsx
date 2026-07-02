import { Clock, Settings, UserCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';

interface SettingsPageProps {
  params: {
    locale: string;
  };
}

export default async function SettingsPage({ params: { locale } }: SettingsPageProps) {
  const t = await getTranslations({ locale, namespace: 'settings' });

  const sections = [
    {
      href: '/settings/profile',
      icon: UserCircle,
      title: t('profile'),
      description: t('overview.profileDescription'),
      action: t('overview.profileAction'),
    },
    {
      href: '/settings/hours',
      icon: Clock,
      title: t('hours'),
      description: t('overview.hoursDescription'),
      action: t('overview.hoursAction'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Settings className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('overview.title')}</h1>
          <p className="text-sm text-gray-500">{t('overview.description')}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="card group flex min-h-40 flex-col justify-between border border-transparent transition hover:border-brand-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-brand-100 group-hover:text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              <span className="mt-4 text-sm font-medium text-brand-600">{section.action}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
