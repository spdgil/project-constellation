/**
 * Deals section loading skeleton.
 */

export default function DealsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-[#E8E6E3] rounded" />
      <div className="h-10 w-full max-w-md bg-[#E8E6E3] rounded" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-[#E8E6E3] rounded" />
        ))}
      </div>
    </div>
  );
}
