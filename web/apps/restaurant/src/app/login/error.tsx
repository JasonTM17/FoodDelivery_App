'use client';

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-100 p-4">
      <div className="card p-8 text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message || 'Không thể tải trang đăng nhập. Vui lòng thử lại.'}
        </p>
        <button onClick={reset} className="btn-primary">
          Thử lại
        </button>
      </div>
    </div>
  );
}
