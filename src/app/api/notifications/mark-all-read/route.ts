import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getInventoryAlerts } from "@/lib/notifications";

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error, user, organization } = await getUserWithRole();
    if (error || !organization || !user) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const { organizationId } = body;

    // Verify user has access to this organization
    if (organizationId && organizationId !== organization.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const alerts = await getInventoryAlerts(organization.id);
    const byType = alerts.reduce<Record<string, typeof alerts[number]["items"]>>(
      (acc, alert) => {
        acc[alert.type] = alert.items;
        return acc;
      },
      {}
    );

    const expiredItems = byType.expired ?? [];
    const expiringItems = byType.expiring ?? [];
    const lowStockItems = byType.low_stock ?? [];

    const excludeLowStockIds = new Set([
      ...expiredItems.map((item) => item.id),
      ...expiringItems.map((item) => item.id),
    ]);

    const notificationIds = [
      ...expiredItems.map((item) => `expired-${item.id}`),
      ...expiringItems.map((item) => `expiring-${item.id}`),
      ...lowStockItems
        .filter((item) => !excludeLowStockIds.has(item.id))
        .map((item) => `low-stock-${item.id}`),
    ];

    if (notificationIds.length > 0) {
      await prisma.$transaction(
        notificationIds.map((notificationId) =>
          prisma.notificationState.upsert({
            where: {
              userId_notificationId: {
                userId: user.id,
                notificationId,
              },
            },
            update: { read: true },
            create: {
              userId: user.id,
              notificationId,
              read: true,
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
