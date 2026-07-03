export interface Restaurant {
  id: string;
  name: string;
  owner?: { name?: string; email?: string; phone?: string };
  cuisine: string;
  rating: number;
  totalOrders: number;
  revenue: number;
  status: string;
  address: string;
  description?: string;
  createdAt: string;
  recentOrders?: {
    id: string;
    orderCode: string;
    customer?: { name?: string };
    total: number;
    status: string;
    createdAt: string;
  }[];
}
