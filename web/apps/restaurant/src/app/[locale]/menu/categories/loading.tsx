export default function CategoriesLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}
    </div>
  );
}
