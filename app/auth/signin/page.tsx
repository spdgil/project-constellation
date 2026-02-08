/**
 * Custom sign-in page — branded login with CDF logo, Google OAuth,
 * and access-denied messaging for non-allowlisted users.
 */

import Image from "next/image";
import { signIn } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const accessDenied = error === "AccessDenied";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7]">
      <div className="w-full max-w-sm mx-auto px-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/CDF-logo.png"
            alt="The Constellation Development Facility"
            width={180}
            height={180}
            priority
            className="h-auto w-auto max-h-28"
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl text-[#2C2C2C] mb-2">
            The Constellation Development Facility
          </h1>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Sign in to access the development facility dashboard.
          </p>
        </div>

        {/* Access denied message */}
        {accessDenied && (
          <div
            className="mb-6 border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3 text-center"
            role="alert"
          >
            <p className="font-medium">Access not granted</p>
            <p className="mt-1 text-red-600 text-xs">
              Your Google account is not on the approved access list.
              Please contact an administrator to request access.
            </p>
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full h-11 flex items-center justify-center gap-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm font-medium hover:border-[#9A9A9A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 transition duration-300 ease-out"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-[#9A9A9A]">
          Access is restricted to authorised team members.
        </p>
      </div>
    </div>
  );
}
