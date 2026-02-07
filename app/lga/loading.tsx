/**
 * LGA section loading skeleton.
 */

export default function LgaLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-[#E8E6E3] rounded" />
      <div className="h-10 w-full max-w-md bg-[#E8E6E3] rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-[#E8E6E3] rounded" />
        ))}
      </div>
    </div>
  );
}
