import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth-helpers";

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
    if (error || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

    // TODO: Replace with actual database deletion
    // await prisma.notification.delete({
    //   where: {
    //     id: notificationId,
    //     organizationId: organization.id
    //   }
    // });

    // For now, just return success
    console.log(`Deleting notification ${notificationId} for org ${organization.id}`);

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