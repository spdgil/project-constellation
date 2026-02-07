import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * /strategies/[id] now lives at /lga/strategies/[id].
 * Redirect any old bookmarks or links.
 */
export default async function StrategyRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/lga/strategies/${id}`);
}
