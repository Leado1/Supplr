import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth-helpers";
import { format } from "date-fns";
import { getInventoryAlerts } from "@/lib/notifications";
import { prisma } from "@/lib/db";

type NotificationType = "info" | "success" | "warning" | "error";

interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const MAX_NOTIFICATIONS = 30;

const dayLabel = (count: number) => (count === 1 ? "day" : "days");

const buildInventoryNotifications = (alerts: Awaited<ReturnType<typeof getInventoryAlerts>>) => {
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

  const notifications: NotificationPayload[] = [];

  for (const item of expiredItems) {
    const daysExpired = Math.abs(item.daysUntilExpiration ?? 0);
    const message =
      daysExpired === 0
        ? `Expired today. Qty: ${item.quantity}.`
        : `Expired ${daysExpired} ${dayLabel(daysExpired)} ago. Qty: ${item.quantity}.`;

    notifications.push({
      id: `expired-${item.id}`,
      type: "error",
      title: `Expired: ${item.name}`,
      message,
      timestamp: item.updatedAt ?? new Date(),
      read: false,
      actionUrl: "/inventory",
    });
  }

  for (const item of expiringItems) {
    const daysRemaining = item.daysUntilExpiration ?? 0;
    const dateLabel = format(item.expirationDate, "MMM d, yyyy");
    const message =
      daysRemaining <= 0
        ? `Expires today (${dateLabel}).`
        : `Expires in ${daysRemaining} ${dayLabel(daysRemaining)} (${dateLabel}).`;

    notifications.push({
      id: `expiring-${item.id}`,
      type: "warning",
      title: `Expiring soon: ${item.name}`,
      message,
      timestamp: item.updatedAt ?? new Date(),
      read: false,
      actionUrl: "/inventory",
    });
  }

  for (const item of lowStockItems) {
    if (excludeLowStockIds.has(item.id)) continue;

    const message =
      item.quantity <= 0
        ? "Out Of Stock. Reorder now."
        : `Only ${item.quantity} left (reorder at ${item.reorderThreshold}).`;

    notifications.push({
      id: `low-stock-${item.id}`,
      type: "warning",
      title: `Low stock: ${item.name}`,
      message,
      timestamp: item.updatedAt ?? new Date(),
      read: false,
      actionUrl: "/inventory",
    });
  }

  return notifications;
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error, user, organization } = await getUserWithRole();
    if (error || !organization || !user) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");

    // Verify user has access to this organization
    if (organizationId && organizationId !== organization.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const alerts = await getInventoryAlerts(organization.id);
    const notifications = buildInventoryNotifications(alerts);
    const notificationIds = notifications.map((notification) => notification.id);

    const states = notificationIds.length
      ? await prisma.notificationState.findMany({
          where: {
            userId: user.id,
            notificationId: { in: notificationIds },
          },
        })
      : [];

    const stateById = new Map(
      states.map((state) => [state.notificationId, state])
    );

    const filtered = notifications
      .filter((notification) => {
        const state = stateById.get(notification.id);
        return !state?.deleted;
      })
      .map((notification) => {
        const state = stateById.get(notification.id);
        return {
          ...notification,
          read: state?.read ?? notification.read,
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, MAX_NOTIFICATIONS);

    return NextResponse.json({
      success: true,
      notifications: filtered
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
