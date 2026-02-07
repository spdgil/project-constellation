/**
 * Strategies section loading skeleton.
 */

export default function StrategiesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-[#E8E6E3] rounded" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[#E8E6E3] rounded" />
        ))}
      </div>
    </div>
  );
}
