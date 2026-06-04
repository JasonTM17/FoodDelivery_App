export default function MenuLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl skeleton" />
          <div>
            <div className="h-6 w-32 skeleton mb-1" />
            <div className="h-4 w-20 skeleton" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-20 skeleton rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="h-40 w-full skeleton rounded-lg" />
            <div className="h-5 w-3/4 skeleton" />
            <div className="h-4 w-1/2 skeleton" />
            <div className="h-5 w-20 skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
