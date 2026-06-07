import { Suspense } from 'react';
import { MenuItemEditor } from '@/components/restaurant/menu/menu-item-editor';
import MenuEditLoading from './loading';

interface EditMenuItemPageProps {
  params: { id: string };
}

export default function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  return (
    <Suspense fallback={<MenuEditLoading />}>
      <MenuItemEditor id={params.id} />
    </Suspense>
  );
}
