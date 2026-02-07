import { redirect } from "next/navigation";

/**
 * /map now lives as a tab on the Home page.
 * Redirect any old bookmarks or links.
 */
export default function MapPage() {
  redirect("/?tab=map");
}
