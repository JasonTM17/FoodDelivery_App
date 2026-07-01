'use client';

export default function StaffError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải nhân viên</h2>
      <p className="text-sm text-gray-500 mb-6">{error.message}</p>
      <button onClick={reset} className="btn-primary">Thử lại</button>
    </div>
  );
}
