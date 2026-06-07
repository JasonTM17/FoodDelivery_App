import { Suspense } from 'react';
import { OrderKanbanBoard } from '@/components/orders/order-kanban-board';
import OrdersLoading from './loading';

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrderKanbanBoard />
    </Suspense>
  );
}
