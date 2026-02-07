import { redirect } from "next/navigation";

/**
 * /strategies/upload now lives at /lga/strategies/upload.
 * Redirect any old bookmarks or links.
 */
export default function StrategyUploadRedirect() {
  redirect("/lga/strategies/upload");
}
