export default function StaffLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />)}
    </div>
  );
}
