export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 mb-4">
            <div className="h-8 w-8 animate-pulse rounded bg-white/50" />
          </div>
          <div className="h-7 w-48 skeleton mx-auto mb-2" />
          <div className="h-4 w-64 skeleton mx-auto" />
        </div>
        <div className="card p-6 space-y-4">
          <div className="h-4 w-20 skeleton" />
          <div className="h-10 w-full skeleton" />
          <div className="h-4 w-20 skeleton" />
          <div className="h-10 w-full skeleton" />
          <div className="h-11 w-full skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}
