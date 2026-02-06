import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C] mb-2">
        Project Constellation
      </h1>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-12">
        Queensland state-level dashboard: opportunity patterns by LGA, deal
        pipeline, project development facility.
      </p>
      <nav aria-label="Entry points">
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          <li>
            <Link
              href="/map"
              className="text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out text-sm leading-relaxed"
            >
              Explore by map
            </Link>
          </li>
          <li>
            <Link
              href="/opportunities"
              className="text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out text-sm leading-relaxed"
            >
              Explore by opportunity types
            </Link>
          </li>
          <li>
            <Link
              href="/deals"
              className="text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7] transition duration-300 ease-out text-sm leading-relaxed"
            >
              Search deals
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
