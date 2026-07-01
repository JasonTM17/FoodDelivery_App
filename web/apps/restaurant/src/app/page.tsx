import { redirect } from 'next/navigation';
import { defaultLocale } from '@foodflow/i18n';

export default function HomePage() {
  redirect(`/${defaultLocale}`);
}
