import { redirect } from "next/navigation";

/**
 * /lga defaults to the Map tab.
 */
export default function LgaPage() {
  redirect("/lga/map");
}
