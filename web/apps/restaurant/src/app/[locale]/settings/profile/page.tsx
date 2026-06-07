import { Suspense } from 'react';
import { ProfileForm } from '@/components/settings/profile-form';
import ProfileLoading from './loading';

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileForm />
    </Suspense>
  );
}
