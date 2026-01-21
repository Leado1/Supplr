import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth-helpers";

// Mock notifications data structure - in production, this would come from your database
const mockNotifications = [
  {
    id: "1",
    type: "warning" as const,
    title: "Low Stock Alert",
    message: "Ibuprofen 200mg is running low. Only 5 units remaining.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    read: false,
    actionUrl: "/inventory"
  },
  {
    id: "2",
    type: "info" as const,
    title: "Expiration Notice",
    message: "3 items will expire within the next 7 days.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    actionUrl: "/inventory?filter=expiring"
  },
  {
    id: "3",
    type: "error" as const,
    title: "Payment Failed",
    message: "Your subscription payment could not be processed. Please update your billing information.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: false,
    actionUrl: "/billing"
  },
  {
    id: "4",
    type: "warning" as const,
    title: "Critical Stock Level",
    message: "Surgical masks are out of stock. Immediate reorder recommended.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    read: true,
    actionUrl: "/inventory"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error, user, organization } = await getUserWithRole();
    if (error || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");

    // Verify user has access to this organization
    if (organizationId && organizationId !== organization.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // TODO: Replace with actual database query
    // const notifications = await prisma.notification.findMany({
    //   where: { organizationId: organization.id },
    //   orderBy: { timestamp: 'desc' },
    //   take: 50
    // });

    // For now, return mock data
    const notifications = mockNotifications.map(notif => ({
      ...notif,
      organizationId: organization.id
    }));

    return NextResponse.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}