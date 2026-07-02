'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo'
import { ArrowLeft, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <FoodFlowLogo showWordmark={false} className="mb-6" markClassName="h-20 w-20" />
      <h1 className="text-6xl font-bold text-muted-foreground/30 mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-2">Không tìm thấy trang</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md text-center">
        Trang bạn yêu cầu không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button asChild>
          <Link href="/overview">
            <Home className="mr-2 h-4 w-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  )
}
