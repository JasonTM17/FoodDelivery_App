export default function PromotionNewLoading() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 skeleton" />
      <div className="card">
        <div className="h-6 w-48 skeleton mb-4" />
        <div className="space-y-3">
          <div className="h-10 w-full skeleton" />
          <div className="h-10 w-full skeleton" />
        </div>
      </div>
    </div>
  );
}
