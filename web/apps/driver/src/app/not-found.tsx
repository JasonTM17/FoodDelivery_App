import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
