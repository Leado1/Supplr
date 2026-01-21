import { redirect } from "next/navigation";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { hasPermission, Permission } from "@/lib/permissions";
import { LocationManagement } from "@/components/locations/location-management";

export default async function LocationsPage() {
  try {
    // Get user's organization with security checks
    const { error, organization, user } = await getUserOrganization();
    if (error || !organization || !user) {
      redirect("/sign-in");
    }

    // Check if user has multi-location access (Enterprise subscription)
    const features = getSubscriptionFeatures(organization.subscription);

    if (!features.multiLocation) {
      redirect("/dashboard");
    }

    // Check if user has permission to manage locations (OWNER or ADMIN)
    if (!hasPermission(user.role, Permission.MANAGE_TEAM)) {
      redirect("/dashboard");
    }

    return <LocationManagement />;
  } catch (error) {
    console.error("Locations page error:", error);
    redirect("/dashboard");
  }
}
