"use client"
import { Button } from "@foodflow/ui/button"
import { AlertTriangle } from "lucide-react"
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="flex flex-col items-center justify-center h-96 gap-4"><AlertTriangle className="h-12 w-12 text-destructive" /><p className="text-lg font-semibold">Không thể tải audit logs</p><Button onClick={reset}>Thử lại</Button></div>
}
