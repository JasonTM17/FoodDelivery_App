import { Suspense } from 'react';
import { MenuItemEditor } from '@/components/restaurant/menu/menu-item-editor';
import MenuEditLoading from './loading';

interface EditMenuItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<MenuEditLoading />}>
      <MenuItemEditor id={id} />
    </Suspense>
  );
}
