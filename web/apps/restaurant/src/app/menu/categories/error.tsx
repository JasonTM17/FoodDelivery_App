'use client';

export default function CategoriesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <span className="text-red-600 text-2xl font-bold">!</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải danh mục</h2>
      <p className="text-sm text-gray-500 mb-6">{error.message}</p>
      <button onClick={reset} className="btn-primary">Thử lại</button>
    </div>
  );
}
