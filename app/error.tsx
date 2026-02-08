"use client";

/**
 * Global error boundary — catches unhandled errors in any route.
 * Next.js renders this automatically when a runtime error occurs.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message =
    process.env.NODE_ENV === "development"
      ? error.message || "An unexpected error occurred. Please try again."
      : "An unexpected error occurred. Please try again.";

  return (
    <div className="max-w-lg mx-auto py-20 text-center" role="alert">
      <h1 className="font-heading text-2xl font-normal text-[#2C2C2C] mb-4">
        Something went wrong
      </h1>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
        {message}
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
