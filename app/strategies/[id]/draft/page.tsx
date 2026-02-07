import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * /strategies/[id]/draft now lives at /lga/strategies/[id]/draft.
 * Redirect any old bookmarks or links.
 */
export default async function StrategyDraftRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/lga/strategies/${id}/draft`);
}
