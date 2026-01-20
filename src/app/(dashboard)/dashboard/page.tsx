import { redirect } from "next/navigation";
import { getUserOrganization } from "@/lib/auth-helpers";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  // Simple authentication check
  const { error: orgError } = await getUserOrganization();
  if (orgError) {
    redirect("/sign-in");
  }

  // Use the client-side component that handles location-aware data fetching
  return <DashboardClient />;
}
