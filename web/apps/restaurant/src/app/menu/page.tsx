import { Suspense } from 'react';
import { MenuBoard } from '@/components/menu/menu-board';
import MenuLoading from './loading';

export const metadata = { title: 'Thực đơn' };

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuLoading />}>
      <MenuBoard />
    </Suspense>
  );
}
