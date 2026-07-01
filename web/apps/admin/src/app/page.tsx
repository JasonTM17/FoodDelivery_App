import { defaultLocale } from '@foodflow/i18n';
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect(`/${defaultLocale}/overview`);
}
