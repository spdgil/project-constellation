import { redirect } from "next/navigation";

/**
 * /strategies now lives at /lga/strategies.
 * Redirect any old bookmarks or links.
 */
export default function StrategiesRedirect() {
  redirect("/lga/strategies");
}
