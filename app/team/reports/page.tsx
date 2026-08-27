import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * The Reports tab was folded into Overview. This route stays as a redirect
 * rather than being deleted: managers bookmark screens, and a 404 on a URL
 * that worked last week reads as the feature being withdrawn.
 */
export default function TeamReportsRoute() {
  redirect(routes.teamOverview);
}
