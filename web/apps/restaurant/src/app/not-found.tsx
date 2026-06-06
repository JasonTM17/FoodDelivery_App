import Link from 'next/link'
import { Store, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 mb-6">
        <Store className="h-10 w-10 text-brand-600" />
      </div>
      <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy trang</h2>
      <p className="text-sm text-gray-500 mb-8 max-w-md text-center">
        Trang bạn yêu cầu không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn.
      </p>
      <Link href="/orders" className="btn-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Về trang đơn hàng
      </Link>
    </div>
  )
}
