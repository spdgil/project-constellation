"use client";

/**
 * Map route error boundary — catches errors loading map data.
 */

export default function MapError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto py-20 text-center" role="alert">
      <h2 className="font-heading text-2xl font-normal text-[#2C2C2C] mb-4">
        Could not load map
      </h2>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
        {error.message || "Failed to load map data. Please try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-9 px-4 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out"
      >
        Try again
      </button>
    </div>
  );
}
