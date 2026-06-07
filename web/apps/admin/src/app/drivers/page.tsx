'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Star, Car, MapPin } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@foodflow/ui/page-header';

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  totalDeliveries: number;
  status: string;
  vehicleType: string;
  createdAt: string;
}

interface DriversResponse {
  drivers: Driver[];
  total: number;
}

export default function DriversPage() {
  const { data, isLoading } = useQuery<DriversResponse>({
    queryKey: ['drivers'],
    queryFn: () => apiGet<DriversResponse>('/admin/drivers'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'Tài xế' }]}
        title="Quản lý tài xế"
        description="Danh sách tài xế trong hệ thống"
        actions={
          <Button asChild>
            <Link href="/drivers/map">
              <MapPin className="mr-2 h-4 w-4" />
              Xem bản đồ
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Tài xế</CardTitle>
          <CardDescription>
            {data ? `Tổng số: ${data.total} tài xế` : 'Đang tải...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : data && data.drivers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tài xế</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Phương tiện</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Số đơn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.vehicleType || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{driver.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{driver.totalDeliveries}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          driver.status === 'online' || driver.status === 'free'
                            ? 'success'
                            : driver.status === 'delivering'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {driver.status === 'online' || driver.status === 'free'
                          ? 'Rảnh'
                          : driver.status === 'delivering'
                          ? 'Đang giao'
                          : 'Bận'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(driver.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Chưa có tài xế nào
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
