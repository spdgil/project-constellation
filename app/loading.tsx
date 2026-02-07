/**
 * Global loading skeleton — displayed during route transitions.
 * Uses neutral design-system tones with a subtle pulse animation.
 */

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Title skeleton */}
      <div className="h-8 w-64 bg-[#E8E6E3] rounded" />

      {/* Subtitle skeleton */}
      <div className="h-4 w-96 max-w-full bg-[#E8E6E3] rounded" />

      {/* Content block skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-[#E8E6E3] rounded"
          />
        ))}
      </div>
    </div>
  );
}
