import { redirect } from "next/navigation";

/**
 * /map now lives at /lga/map.
 * Redirect any old bookmarks or links.
 */
export default function MapPage() {
  redirect("/lga/map");
}
