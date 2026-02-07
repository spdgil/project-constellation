/**
 * Global 404 page — displayed when no route matches.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <h1 className="font-heading text-2xl font-normal text-[#2C2C2C] mb-4">
        Page not found
      </h1>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block h-9 px-4 leading-9 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out"
      >
        Go to home
      </Link>
    </div>
  );
}
