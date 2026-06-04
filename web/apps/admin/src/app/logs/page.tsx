"use client"

import { useEffect, useState } from "react"
import { Search, Filter, Download } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@foodflow/ui/card"
import { Input } from "@foodflow/ui/input"
import { Button } from "@foodflow/ui/button"
import { Badge } from "@foodflow/ui/badge"
import { Skeleton } from "@foodflow/ui/skeleton"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@foodflow/ui/table"
import { getAuditLogs } from "@/lib/api"

const actionLabels: Record<string, string> = {
  'AdminController.getDashboard': 'Xem dashboard',
  'AdminController.getOrders': 'Xem đơn hàng',
  'AdminController.toggleUserStatus': 'Khóa/Mở user',
  'AdminController.toggleRestaurantStatus': 'Khóa/Mở nhà hàng',
  'AdminController.updateSupportTicket': 'Cập nhật ticket',
  'User': 'Quản lý user',
  'Order': 'Quản lý đơn',
  'Restaurant': 'Quản lý NH',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAuditLogs().then(d => setLogs(d.logs)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Audit Logs</h2><p className="text-muted-foreground">Lịch sử hoạt động của admin</p></div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" />Xuất CSV</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs as any[]).map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="font-medium">{log.adminId?.slice(0, 8) ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                    <TableCell>{log.targetType}</TableCell>
                    <TableCell className="font-mono text-xs">{log.targetId?.slice(0, 8) ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{log.ipAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
