'use client';

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-50 to-orange-100">
      <p className="text-sm text-red-600">{error.message}</p>
      <button
        onClick={reset}
        className="btn-primary px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
