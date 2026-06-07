import { Suspense } from 'react';
import { ProfileForm } from '@/components/settings/profile-form';
import ProfileLoading from './loading';

export const metadata = {
  title: 'Hồ sơ nhà hàng',
  description: 'Chỉnh sửa thông tin, ảnh đại diện và tài khoản nhận thanh toán',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileForm />
    </Suspense>
  );
}
