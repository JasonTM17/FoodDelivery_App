'use client';

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <p className="text-sm text-red-600">{error.message}</p>
      <button onClick={reset} className="btn-primary px-4 py-2 text-sm">
        Try again
      </button>
    </div>
  );
}
