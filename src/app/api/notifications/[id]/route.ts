import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function DELETE(
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
        deleted: true,
        read: true,
      },
      create: {
        userId: user.id,
        notificationId,
        deleted: true,
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
