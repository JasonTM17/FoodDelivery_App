export default function InsightsLoading() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-lg bg-gray-100 animate-pulse" />)}
    </div>
  );
}
