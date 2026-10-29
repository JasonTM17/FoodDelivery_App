import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This page does not exist.</p>
      <Link href="/home" className="text-sm font-medium text-primary hover:underline">
        Back to restaurants
      </Link>
    </div>
  );
}
