'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Activity, ExternalLink, CheckCircle2, XCircle } from 'lucide-react'

const workflows = [
  { name: 'Phát hiện đơn trễ', status: 'active', lastRun: '2 phút trước', runs: 142 },
  { name: 'Chat hỗ trợ', status: 'active', lastRun: '5 phút trước', runs: 89 },
  { name: 'Tài xế dừng', status: 'active', lastRun: '12 phút trước', runs: 34 },
  { name: 'Báo cáo ngày', status: 'inactive', lastRun: 'Hôm qua 23:00', runs: 1 },
  { name: 'Gợi ý khuyến mãi', status: 'error', lastRun: '1 giờ trước', runs: 7 },
]

const executions = [
  { workflow: 'Phát hiện đơn trễ', trigger: 'Cron 5m', duration: '1.2s', status: 'success' },
  { workflow: 'Chat hỗ trợ', trigger: 'Webhook', duration: '0.8s', status: 'success' },
  { workflow: 'Tài xế dừng', trigger: 'Webhook', duration: '2.1s', status: 'success' },
  { workflow: 'Gợi ý khuyến mãi', trigger: 'Cron 1h', duration: '—', status: 'error' },
  { workflow: 'Chat hỗ trợ', trigger: 'Webhook', duration: '0.9s', status: 'success' },
  { workflow: 'Phát hiện đơn trễ', trigger: 'Cron 5m', duration: '1.4s', status: 'success' },
]

function WorkflowStatusBadge({ status }: { status: string }) {
  if (status === 'active')
    return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">● Hoạt động</Badge>
  if (status === 'error')
    return <Badge variant="destructive">● Lỗi</Badge>
  return <Badge variant="secondary">● Tắt</Badge>
}

function ExecutionStatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  return <XCircle className="h-4 w-4 text-destructive" />
}

export default function AiMonitorWorkflowsClient() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">N8N Instance</span>
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">● Online</Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href={process.env.NEXT_PUBLIC_N8N_URL ?? 'http://localhost:5678'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Xem N8N Dashboard
          </a>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {workflows.map((wf) => (
          <Card key={wf.name} className="hover:shadow-elevated hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{wf.name}</p>
              <WorkflowStatusBadge status={wf.status} />
              <p className="mt-2 text-xs text-muted-foreground">Chạy: {wf.runs} lần</p>
              <p className="text-xs text-muted-foreground">{wf.lastRun}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lần chạy gần nhất</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((exec, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{exec.workflow}</TableCell>
                  <TableCell className="text-muted-foreground">{exec.trigger}</TableCell>
                  <TableCell className="text-muted-foreground">{exec.duration}</TableCell>
                  <TableCell>
                    <ExecutionStatusIcon status={exec.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
