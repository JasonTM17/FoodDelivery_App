export default function CategoriesLoading() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 skeleton" />
      <div className="h-10 w-64 skeleton" />
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
    </div>
  );
}
