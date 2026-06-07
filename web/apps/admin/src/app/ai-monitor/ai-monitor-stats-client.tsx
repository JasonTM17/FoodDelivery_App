'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, CheckCheck, AlertCircle, DollarSign } from 'lucide-react'

const chatStats = [
  { label: 'Tổng cuộc hội thoại', value: '1,248', icon: MessageSquare, color: 'text-primary' },
  { label: 'Tự giải quyết', value: '1,041', icon: CheckCheck, color: 'text-emerald-500' },
  { label: 'Chuyển người xử lý', value: '207', icon: AlertCircle, color: 'text-amber-500' },
]

export default function AiMonitorStatsClient() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            Thống kê AI Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{stat.value}</span>
                </div>
              )
            })}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tỉ lệ tự giải quyết</span>
                <span className="text-sm font-semibold text-emerald-600">83.4%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary" />
            Chi phí Gemini hôm nay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">$0.42</span>
              <span className="mb-1 text-sm text-muted-foreground">/ ngân sách $5.00</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: '8.4%' }} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-xs text-muted-foreground">Input tokens</p>
                <p className="text-sm font-medium">842K</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Output tokens</p>
                <p className="text-sm font-medium">128K</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Requests</p>
                <p className="text-sm font-medium">1,248</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg latency</p>
                <p className="text-sm font-medium">0.9s</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
