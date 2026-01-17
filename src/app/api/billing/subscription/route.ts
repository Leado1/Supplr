import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization with subscription
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get current item count
    const currentItemCount = await prisma.item.count({
      where: { organizationId: user.organizationId },
    });

    const subscription = user.organization.subscription;

    if (!subscription) {
      // Create a default trial subscription if none exists
      const newSubscription = await prisma.subscription.create({
        data: {
          organizationId: user.organizationId,
          plan: "trial",
          status: "trialing",
          itemLimit: 5,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
      });

      return NextResponse.json({
        ...newSubscription,
        currentItemCount,
      });
    }

    return NextResponse.json({
      ...subscription,
      currentItemCount,
    });
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
