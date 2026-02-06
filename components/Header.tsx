import Link from "next/link";

export function Header() {
  return (
    <header
      className="border-b bg-[#FAF9F7] border-[#E8E6E3]"
      role="banner"
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex items-center gap-8 h-14">
        <Link
          href="/"
          className="font-heading text-xl text-[#2C2C2C] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition-[box-shadow] duration-200 ease-out"
        >
          Project Constellation
        </Link>
        <nav aria-label="Main" className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-[#6B6B6B] underline underline-offset-2 hover:text-[#2C2C2C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-sm text-[#6B6B6B] underline underline-offset-2 hover:text-[#2C2C2C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
