export default function OrdersLoading() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
