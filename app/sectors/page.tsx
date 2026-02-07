import { redirect } from "next/navigation";

/**
 * /sectors defaults to the Sectors list tab.
 */
export default function SectorsPage() {
  redirect("/sectors/list");
}
