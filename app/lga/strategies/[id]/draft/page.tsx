import { notFound } from "next/navigation";
import { loadStrategyById } from "@/lib/db/queries";
import { StrategyDraft } from "@/components/strategies/StrategyDraft";

interface StrategyDraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function StrategyDraftPage({
  params,
}: StrategyDraftPageProps) {
  const { id } = await params;

  const strategy = await loadStrategyById(id);

  if (!strategy) {
    notFound();
  }

  return (
    <div>
      <h1 className="sr-only">Strategy draft</h1>
      <StrategyDraft strategy={strategy} />
    </div>
  );
}
