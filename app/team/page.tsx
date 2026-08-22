import { redirect } from "next/navigation";

/**
 * /team is now a section. Overview is its landing screen, and TeamHubLayout
 * handles the no-team case from there — so this redirect is unconditional and
 * every old link keeps working.
 */
export default function TeamIndexRoute() {
  redirect("/team/overview");
}
