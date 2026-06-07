export default function NewMenuItemLoading() {
  return (
    <div>
      <div className="h-4 w-24 skeleton mb-6" />
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl skeleton" />
        <div>
          <div className="h-6 w-36 skeleton mb-1" />
          <div className="h-4 w-48 skeleton" />
        </div>
      </div>
      <div className="card max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <div className="h-4 w-16 skeleton mb-2" />
            <div className="h-10 w-full skeleton rounded-lg" />
          </div>
          <div className="col-span-2">
            <div className="h-4 w-16 skeleton mb-2" />
            <div className="h-20 w-full skeleton rounded-lg" />
          </div>
          <div>
            <div className="h-4 w-12 skeleton mb-2" />
            <div className="h-10 w-full skeleton rounded-lg" />
          </div>
          <div>
            <div className="h-4 w-16 skeleton mb-2" />
            <div className="h-10 w-full skeleton rounded-lg" />
          </div>
        </div>
        <div className="h-10 w-24 skeleton rounded-lg ml-auto" />
      </div>
    </div>
  );
}
