import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error, user, organization } = await getUserWithRole();
    if (error || !organization || !user) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

    await prisma.notificationState.upsert({
      where: {
        userId_notificationId: {
          userId: user.id,
          notificationId,
        },
      },
      update: {
        read: true,
      },
      create: {
        userId: user.id,
        notificationId,
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
