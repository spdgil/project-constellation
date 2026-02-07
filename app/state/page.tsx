import { redirect } from "next/navigation";

/**
 * /state has been consolidated into the Home page.
 * Redirect any old bookmarks or links.
 */
export default async function StatePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  if (params.tab === "map") redirect("/?tab=map");
  redirect("/");
}
