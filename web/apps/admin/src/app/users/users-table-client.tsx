'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useTableFilters } from '@/hooks/use-table-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const roleVariants: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  admin: 'destructive',
  restaurant_owner: 'default',
  driver: 'secondary',
  customer: 'outline',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  restaurant_owner: 'Chủ nhà hàng',
  driver: 'Tài xế',
  customer: 'Khách hàng',
};

export default function UsersTableClient() {
  const queryClient = useQueryClient();
  const { page, filter: roleFilter, setFilter: setRoleFilter, prevPage, nextPage } =
    useTableFilters();

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['users', page, roleFilter],
    queryFn: () =>
      apiGet<UsersResponse>('/admin/users', {
        params: {
          page,
          limit: 15,
          role: roleFilter !== 'all' ? roleFilter : undefined,
        },
      }),
  });

  const toggleBan = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    await apiPatch(`/admin/users/${userId}/status`, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="customer">Khách hàng</SelectItem>
            <SelectItem value="driver">Tài xế</SelectItem>
            <SelectItem value="restaurant_owner">Chủ nhà hàng</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Người dùng</CardTitle>
          <CardDescription>
            {data ? `Tổng số: ${data.total} người dùng` : 'Đang tải...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : data && data.users.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead className="w-24">Khóa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{user.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={roleVariants[user.role] || 'outline'}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                          {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.status === 'active'}
                          onCheckedChange={() => toggleBan(user.id, user.status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Trang {data.page} / {data.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={prevPage} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nextPage(data.totalPages)}
                    disabled={page >= data.totalPages}
                  >
                    Sau<ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Không tìm thấy người dùng nào
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
