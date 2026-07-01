"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@foodflow/ui/card"
import { Button } from "@foodflow/ui/button"
import { Skeleton } from "@foodflow/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@foodflow/ui/table"
import { EmptyState } from "@foodflow/ui/empty-state"
import { PageHeader } from "@foodflow/ui/page-header"
import { getAuditLogs, type AuditLogFilter } from "@/lib/api"
import { useTranslations } from "next-intl"

const PAGE_SIZE = 20

export default function AuditLogsPage() {
  const t = useTranslations('logs')
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actor, setActor] = useState("")
  const [action, setAction] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)

  const fetchLogs = useCallback(async (filter: AuditLogFilter) => {
    setLoading(true)
    try {
      const data = await getAuditLogs(filter)
      setLogs(data.logs)
      setTotal(data.total ?? data.logs.length)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs({
      actor: actor || undefined,
      action: action || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: PAGE_SIZE,
    })
  // page changes trigger re-fetch; actor/action/date only on explicit search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLogs, page])

  const handleSearch = () => {
    setPage(1)
    fetchLogs({
      actor: actor || undefined,
      action: action || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: 1,
      limit: PAGE_SIZE,
    })
  }

  const handleExport = () => {
    const header = ["Thời gian", "Admin", "Hành động", "Đối tượng", "ID", "IP"]
    const rows = logs.map((l) => [
      new Date(l.createdAt as string).toLocaleString("vi-VN"),
      String(l.adminId ?? "").slice(0, 8),
      String(l.action ?? ""),
      String(l.targetType ?? ""),
      String(l.targetId ?? "").slice(0, 8),
      String(l.ipAddress ?? ""),
    ])
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Admin" }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
        actions={
          <Button variant="outline" onClick={handleExport} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />{t('exportCsv')}
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Admin ID / Email..."
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="Hành động..."
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-48"
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Không có log nào"
              description="Thử thay đổi bộ lọc hoặc chọn khoảng thời gian khác"
            />
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
                {/* logs are Record<string,unknown> — cast needed for table rendering */}
                {(logs as Array<Record<string, string>>).map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {String(log.adminId ?? "").slice(0, 8) || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.targetType}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {String(log.targetId ?? "").slice(0, 8) || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
